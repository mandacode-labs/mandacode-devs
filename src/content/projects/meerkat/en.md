---
title: Meerkat
description: AI agent-based log analysis and monitoring system
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
role: Full Stack Development
order: 2
coverImage: "https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png"
blogUrl: /ko/blog/meerkat-deep-dive
---

Meerkat is an observability platform that vectorizes logs for storage and uses AI agents to detect anomalies by leveraging both stored data and real-time collected logs. Unlike traditional rule-based alert systems, it utilizes LLMs to allow agents to directly analyze logs and metrics based on natural language queries or information delivered through external events to detect anomalies. It is designed to be used in conjunction with data collection tools like OpenTelemetry, and analysis results are delivered to external channels like Slack via webhooks.
