---
title: Meerkat
description: AI Agent-based Log Analysis and Monitoring System
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
duration: 2026.04 - 2026.06
teamSize: 1
role: Full-stack Development
order: 2
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png'
blogUrl: /ko/blog/meerkat-deep-dive
---
Meerkat is an observability platform where an AI Agent directly analyzes infrastructure logs and metrics to detect anomalies. Moving beyond the limitations of traditional rule-based alerts, the AI autonomously understands context from natural language queries or events delivered via external webhooks, querying tools like Prometheus and Loki to infer causes. Logs are collected using OpenTelemetry and stored in a vector database to support semantic-based searches, with analysis results delivered to external channels via webhooks.

The system is composed of two independent services, Analyzer and Vectors, and is deployed in a Kubernetes environment using Helm Charts. The Analyzer is designed to operate reliably even with large-scale log processing, featuring an asynchronous worker pool, duplicate analysis prevention, and context overflow recovery mechanisms.
