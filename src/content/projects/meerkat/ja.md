---
title: ミーアキャット
description: AIエージェントベースのログ分析およびモニタリングシステム
sourceUrl: "https://github.com/serengeti-sh/meerkat"
status: production
tags:
  - Go
  - gRPC
  - OpenTelemetry
  - OpenAI API
  - RAG
  - PostgreSQL
  - Milvus
  - Kubernetes
  - Helm
  - Ent ORM
duration: 2026.04 - 2026.06
teamSize: 1
role: フルスタック開発
order: 2
coverImage: "https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png"
blogUrl: /ko/blog/meerkat-deep-dive
---

ミーアキャットは、ログをベクトル化して保存し、AIエージェントが保存されたデータとリアルタイムで収集されるログを活用して異常を検出するオブザーバビリティプラットフォームです。従来のルールベースのアラートシステムとは異なり、LLMを活用してエージェントが自然言語クエリや外部イベントを通じて提供された情報に基づいてログとメトリクスを直接分析し、異常を検出します。OpenTelemetryのようなデータ収集ツールと組み合わせて使用するように設計されており、分析結果はWebhookを通じてSlackなどの外部チャネルに配信されます。
