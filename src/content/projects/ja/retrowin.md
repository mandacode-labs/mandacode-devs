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
lang: ja
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
blogUrl: /ko/blog/retrowin-deep-dive
title: レトロウィン
description: 外部ストレージ連携ファイル管理および保存サービス
duration: 2024.10 - 2024.12
role: フルスタック開発
---

Retrowinは、外部オブジェクトストレージと連携してPOSIXスタイルのファイル管理インターフェースを提供する分散ファイル管理システムです。  
ユーザーは馴染みのあるディレクトリ構造と権限体系でファイルを扱いながら、実際のデータはS3やMinIOに安全に保存されます。  
Presigned URLベースの2段階アップロードとアトミックトランザクションでデータの整合性を保証し、Keycloak OIDC認証とUnixスタイルの権限管理でセキュリティを確保しました。

Garbage Collection機能で使用されていないファイルを自動的に整理し、ストレージコストを削減します。  
Windows XPスタイルのレトロUIを通じて、懐かしい感性と現代的なユーザー体験を同時に提供します。  
KubernetesとHelm Chartを活用したデプロイで高い拡張性と安定性を確保します。
