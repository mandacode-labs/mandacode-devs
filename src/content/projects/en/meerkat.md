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
title: Meerkat
description: AI Agent-based Log Analysis and Monitoring System
duration: April 2026 - June 2026
role: Full Stack Development
---
Meerkat is an observability platform where AI Agents directly analyze infrastructure logs and metrics to detect anomalies. Moving beyond the limitations of traditional rule-based alerts, the AI independently understands context from natural language queries or events delivered via external webhooks. It queries tools like Prometheus and Loki directly to infer causes. Logs are collected with OpenTelemetry and stored in a vector database to support semantic-based searches, with analysis results delivered to external channels via webhooks.

The system is composed of two independent services: Analyzer and Vectors, and is deployed in a Kubernetes environment using Helm Charts. The Analyzer is designed to operate reliably even with large-scale log processing, thanks to features like an asynchronous worker pool, duplicate analysis prevention, and context overflow recovery mechanisms.
