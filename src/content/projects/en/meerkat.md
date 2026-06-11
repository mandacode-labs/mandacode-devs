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
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png'
blogUrl: /ko/blog/meerkat-deep-dive
title: 미어캣
description: AI Agent-based Log Analysis and Monitoring System
duration: April 2026 - June 2026
role: Full-stack development
---
Meerkat is an observability platform where an AI Agent directly analyzes infrastructure logs and metrics to detect anomalies. It goes beyond the limitations of traditional rule-based alerts, allowing the AI to understand context from natural language queries or events delivered via external webhooks. It queries tools like Prometheus and Loki directly to infer causes. Logs collected with OpenTelemetry are stored in a vector database to support semantic-based searches, and the analysis results are delivered to external channels via webhooks.

The system is composed of two independent services, Analyzer and Vectors, and is deployed in a Kubernetes environment using a Helm Chart. The Analyzer is designed to operate reliably even with large-scale log processing through features like an asynchronous worker pool, duplicate analysis prevention, and context overflow recovery mechanisms. Vectors remove log redundancy through template extraction and store them in Milvus after OpenAI embedding, enabling efficient semantic search.
