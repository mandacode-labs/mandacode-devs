---
title: Retrowin
description: External storage integration file management and storage services
url: 'https://retrowin.mandacode.com'
sourceUrl: 'https://github.com/mandacode-labs/retrowin-go'
status: production
techStack:
  - Go
  - Kubernetes
  - AWS S3
  - React
  - Next.js
  - Keycloak
  - PostgreSQL
  - Valkey
  - ogen
  - Ent ORM
  - Helm
order: 1
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png'
blogUrl: /ko/blog/retrowin-deep-dive
---

Retrowin is a distributed file management system that works with external object storage to provide a POSIX-style file management interface.
Users work with files in a familiar directory structure and permissions scheme, while the actual data is stored securely in S3 or MinIO.
Presigned URL-based two-step uploads and atomic transactions ensure data consistency, and Keycloak OIDC authentication and Unix-style permissions management ensure security.

Garbage Collection feature automatically cleans up unused files to reduce storage costs,
A Windows XP-style retro UI provides a retro sensibility and modern user experience at the same time.
Deployment utilizes Kubernetes and Helm Chart for high scalability and reliability.
