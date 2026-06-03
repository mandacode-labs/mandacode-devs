---
title: Retrowin
description: External Storage Integration File Management and Storage Service
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
  - Ent ORM
  - Helm
duration: 2024.10 - 2024.12
teamSize: 1
role: Full-stack Developer
order: 1
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png'
blogUrl: /ko/blog/retrowin-deep-dive
---
Retrowin is a distributed file management system that provides a POSIX-style file management interface by integrating with external object storage. Users can handle files with a familiar directory structure and permission system, while the actual data is securely stored in S3 or MinIO. It ensures data consistency with a two-step upload process based on presigned URLs and atomic transactions, and enhances security through Keycloak OIDC authentication and Unix-style permission management.

The Garbage Collection feature automatically cleans up unused files, reducing storage costs, and offers a retro aesthetic combined with a modern user experience through a Windows XP-style retro UI. Deployment utilizing Kubernetes and Helm Chart ensures high scalability and stability.
