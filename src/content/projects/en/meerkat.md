---
title: Meerkat
description: AI Agent-based log analysis and monitoring system
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
duration: 2024.09 - 2025.02
teamSize: 1
role: 풀스택 개발
order: 2
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png'
blogUrl: /ko/blog/meerkat-deep-dive
---

Meerkat is an observability platform where AI agents directly analyze logs and metrics from your infrastructure to detect anomalies.
Going beyond the limitations of traditional rule-based alerting, AI can contextualize events fed to it via natural language queries or external webhooks, directly query tools like Prometheus and Loki, and infer causes.
directly query tools like Prometheus, Loki, and others to infer the cause.
Logs are collected with OpenTelemetry and stored in the Vector database for semantic search,
Analytics results are delivered to external channels via webhooks.

The system consists of two independent services, Analyzer and Vectors, deployed as Helm Chart in a Kubernetes environment.
Analyzer is designed to be reliable for large-scale log processing with an asynchronous worker pool, duplicate analysis prevention, and context overflow recovery mechanisms.
