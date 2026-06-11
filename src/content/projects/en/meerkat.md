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
role: Full-stack development
---
Meerkat is an observability platform where AI Agents directly analyze infrastructure logs and metrics to detect anomalies. Going beyond the limitations of traditional rule-based alerts, the AI autonomously understands the context of events delivered through natural language queries or external webhooks, queries tools like Prometheus and Loki directly, and infers the causes. Logs collected via OpenTelemetry are stored in a vector database to support semantic-based searches, and the analysis results are delivered to external channels via webhooks.

The system is composed of two independent services, Analyzer and Vectors, and is deployed in a Kubernetes environment using a Helm Chart. The Analyzer is designed to operate reliably even with large-scale log processing through asynchronous worker pools, duplicate analysis prevention, and context overflow recovery mechanisms. Vectors eliminate log redundancy through template extraction and implement efficient semantic search by storing data in Milvus after OpenAI embedding.
