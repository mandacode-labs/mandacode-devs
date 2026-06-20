---
title: 狐獴
description: 基于AI代理的日志分析和监控系统
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
role: 全栈开发
order: 2
coverImage: "https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png"
blogUrl: /ko/blog/meerkat-deep-dive
---

狐獴是一个将日志向量化存储的可观测性平台，AI代理利用存储的数据和实时收集的日志来检测异常。与传统的规则基础警报系统不同，狐獴利用LLM，代理可以根据自然语言查询或通过外部事件传递的信息直接分析日志和指标以检测异常。它被设计为与OpenTelemetry等数据收集工具结合使用，分析结果通过Webhook传递到Slack等外部渠道。
