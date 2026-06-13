---
url: "https://retrowin.mandacode.com"
sourceUrl: "https://github.com/mandacode-labs/retrowin-go"
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
  - Ent ORM
  - Helm
teamSize: 1
order: 1
lang: en
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
blogUrl: /ko/blog/retrowin-deep-dive
title: Retrowin
description: External Storage Integration File Management and Storage Service
duration: October 2024 - December 2024
role: Full-stack development
---

Retrowin is a distributed file management system that integrates with external object storage to provide a POSIX-style file management interface. Users can handle files with a familiar directory structure and permission system, while the actual data is securely stored in S3 or MinIO. It ensures data consistency with presigned URL-based two-step uploads and atomic transactions, and secures access with Keycloak OIDC authentication and Unix-style permission management.

The Garbage Collection feature automatically cleans up unused files to reduce storage costs, and the retro UI styled after Windows XP offers a nostalgic feel alongside a modern user experience. Deployment using Kubernetes and Helm Chart ensures high scalability and stability.
