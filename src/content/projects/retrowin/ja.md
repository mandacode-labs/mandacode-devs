---
title: Retrowin
description: 外部ストレージ連携ファイル管理および保存サービス
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
role: フルスタック開発
order: 1
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
blogUrl: /ko/blog/retrowin-deep-dive
---

Retrowinは外部オブジェクトストレージと連携し、POSIXスタイルのファイル管理インターフェースを提供するファイル管理システムです。Presigned URLに基づく2段階アップロードとアトミックトランザクションでデータの整合性を保証し、Garbage Collection機能で使用されていないファイルを自動的に整理してストレージコストを削減しました。Keycloak OIDC認証を活用した独自のセッション管理でセキュリティを確保し、Windows XPスタイルのレトロUIを通じてレトロな感性と現代的なユーザー体験を同時に提供します。
