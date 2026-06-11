---
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
teamSize: 1
order: 1
lang: zh
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png'
blogUrl: /ko/blog/retrowin-deep-dive
title: Retrowin
description: 外部存储集成文件管理和存储服务
duration: 2024.10 - 2024.12
role: 全栈开发
---
Retrowin是一个分布式文件管理系统，通过与外部对象存储集成，提供POSIX风格的文件管理接口。用户可以使用熟悉的目录结构和权限体系来处理文件，而实际数据则安全地存储在S3或MinIO中。通过基于Presigned URL的两阶段上传和原子事务来保证数据一致性，并通过Keycloak OIDC认证和Unix风格的权限管理来确保安全。

通过垃圾回收功能自动清理未使用的文件，以降低存储成本，并通过Windows XP风格的复古UI同时提供复古情感和现代用户体验。利用Kubernetes和Helm Chart进行部署，以确保高扩展性和稳定性。
