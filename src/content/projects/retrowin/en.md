---
title: Retrowin
description: External storage integration file management and storage service
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
duration: 2024.10 - 2024.12
teamSize: 1
role: Full-stack development
order: 1
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
blogUrl: /ko/blog/retrowin-deep-dive
---

Retrowin is a file management system that provides a POSIX-style file management interface by integrating with external object storage. It ensures data consistency with a two-step upload based on Presigned URLs and atomic transactions, and reduces storage costs by automatically cleaning up unused files with a Garbage Collection feature. Security is ensured through self-managed sessions utilizing Keycloak OIDC authentication, and it offers a retro feel and modern user experience with a Windows XP style retro UI.
