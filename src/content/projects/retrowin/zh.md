---
title: Retrowin
description: 外部存储集成文件管理和存储服务
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
role: 全栈开发
order: 1
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
blogUrl: /ko/blog/retrowin-deep-dive
---

Retrowin 是一个文件管理系统，通过与外部对象存储集成，提供 POSIX 风格的文件管理接口。它通过基于预签名 URL 的两阶段上传和原子事务来保证数据一致性，并通过垃圾回收功能自动清理未使用的文件，从而降低存储成本。利用 Keycloak OIDC 认证进行自有会话管理以确保安全，并通过 Windows XP 风格的复古 UI 同时提供怀旧感和现代用户体验。
