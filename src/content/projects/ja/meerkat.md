---
sourceUrl: 'https://github.com/serengeti-sh/meerkat'
status: production
techStack:
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
teamSize: 1
order: 2
lang: ja
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png'
blogUrl: /ko/blog/meerkat-deep-dive
title: ミーアキャット
description: AIエージェント基盤のログ分析およびモニタリングシステム
duration: 2026.04 - 2026.06
role: フルスタック開発
---
Meerkatは、AIエージェントが直接インフラのログとメトリクスを分析し、異常を検出するオブザーバビリティプラットフォームです。従来のルールベースのアラートの限界を超え、自然言語クエリや外部Webhookを通じて伝達されたイベントをAIが自ら文脈を理解し、PrometheusやLokiなどのツールを直接クエリして原因を推論します。OpenTelemetryで収集されたログをベクターデータベースに保存し、意味ベースの検索をサポートし、分析結果はWebhookで外部チャンネルに伝達されます。

システムはAnalyzerとVectorsの2つの独立したサービスで構成されており、Kubernetes環境でHelm Chartを使用してデプロイされます。Analyzerは非同期ワーカープールと重複分析防止、コンテキストオーバーフロー回復メカニズムなどを通じて、大規模なログ処理にも安定して動作するように設計されています。Vectorsはテンプレート抽出を通じてログの重複を除去し、OpenAIの埋め込みを経てMilvusに保存し、効率的な意味検索が可能になるように実装されています。
