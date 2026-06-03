---
title: "Retrowin: POSIX filesystem implemented on top of object storage"
description: >-
  A deep dive into Retrowin's hexagonal architecture, presigned URL-based atomic
  uploads, Keycloak OIDC authentication, and GC design.
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Go
  - S3
  - Filesystem
  - Keycloak
  - PostgreSQL
  - Kubernetes
lang: en
---

## enters

Cloud storage offers infinite capacity and durability, but it's still too complex for developers to handle directly. Retrowin provides an abstract layer that allows you to treat object storage like S3 or MinIO as if it were a local filesystem. It borrows Linux's Inode and Dentry concepts to implement its directory structure and permissions scheme, and adds a touch of Windows XP-style retro UI. In this article, we'll analyze its architecture and key technical decisions.

## Hexagonal architecture and dependency injection

Retrowin adopted a hexagonal architecture for a clear separation of layers: types and routers generated from the OpenAPI specification with ogen sit at the top, and HTTP handlers that implement them receive requests. The handler calls an application service registered in the Uber FX dependency injection container, which in turn interacts with domain services.

At the core of the domain layer are three concepts: Inode, Dentry, and Object. Inodes store the metadata of files, while Dentry manages the mapping of file names to Inode IDs in the directory. What's interesting is that Dentry is stored as a JSON blob in the content column of an Inode, rather than in a separate table. This means that directory lookups only need to read a single row without joins, which is low latency, and also allows you to utilize PostgreSQL's JSONB index. The downside is that you have to rewrite the entire JSON when modifying the directory, but this is negligible when the directory size is small.

## Atomic uploads with presigned URLs

To allow large files to be uploaded directly to S3 by the client without a server proxy, we implemented a presigned URL mechanism. The upload is divided into two phases: initiate and complete. During initiate, we create a pending object record in PostgreSQL and issue an S3 presigned PUT URL. We adjust the URL expiration time based on the file size, which we set to 15 minutes for files under 10MB and 6 hours for files over 1GB.

When the request is complete, FsService.AtomicUpload() starts a PostgreSQL transaction. Within the transaction, it checks for the existence of the S3 object, changes its status to active, creates an Inode, and connects to Dentry. If any step in the transaction fails, the entire thing is rolled back so that data consistency is not broken. It also supports equivalence keys so that retries of the same upload request reuse the existing pending record and only issue a new presigned URL.

## Keycloak OIDC authentication and session management

Authentication uses Keycloak as an OIDC provider. Implement a PKCE-based login flow to temporarily store the authorization code and code_verifier in Valkey with a 5 minute TTL. On callback, we validate the state and code_verifier, exchange tokens, check the user with UserInfo and auto-generate it if it's not in the DB.

The session is kept in Valkey, and for each API request, ogen's SecurityHandler validates it by reading the session_id from the cookie. The OIDC client is lazily initialized with sync.Once, so that temporary unavailability of Keycloak does not prevent the server from starting up. Permission checking is done with Inode.CheckPerm(), which checks standard Unix permission bits, with UID 0 allowing full access as root.

## Garbage Collection and operations

GC is a Kubernetes CronJob that runs every day at 3am. It performs cleanup in two phases: first, it deletes expiring objects that have been pending for more than 24 hours, and second, it finds and cleans up orphaned objects that show up as active in the DB but don't actually exist in S3. This resolves inconsistencies left over from direct deletion of S3 data externally or from the failure of previous cleanups.

Deployments are managed by Helm Chart, which separates application settings in ConfigMap from sensitive information in Secret. In the security context, we applied runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation: false, and dropped all capabilities. We mounted the emptyDir volume to /tmp to allow temporary file operations even on the read-only root filesystem.

## Tradeoffs in design decisions.

JSON blob-based Dentry improves lookup performance, but is limited in scaling horizontally because the lock for concurrent directory modifications is based on in-memory sync.Map. It is also vulnerable to link loops because symbolic link resolution is recursive and has no cycle detection. However, in single-user or small team usage environments, these tradeoffs are acceptable, and the operational benefits of simplicity are outweighed.

## Conclusion.

Retrowin is an interesting experiment that combines the scalability of object storage with the familiarity of POSIX filesystems. We've included elements from real-world production environments, such as atomic uploads, OIDC authentication, and GC, while leveraging modern tools from the Go ecosystem like Ent ORM and ogen. The retro UI sums up the project's identity as both technically challenging and fun.
