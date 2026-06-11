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
lang: zh
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png'
blogUrl: /ko/blog/meerkat-deep-dive
title: 猫鼬
description: 基于AI Agent的日志分析与监控系统
duration: 2026.04 - 2026.06
role: 全栈开发
---
Meerkat是一个可观测性平台，AI Agent直接分析基础设施的日志和指标以检测异常迹象。超越传统规则基础的警报，AI可以通过自然语言查询或外部webhook传递的事件自行理解上下文，并直接查询Prometheus、Loki等工具进行原因推断。通过OpenTelemetry收集的日志被存储在向量数据库中，以支持基于语义的搜索，分析结果通过webhook传递到外部渠道。

系统由Analyzer和Vectors两个独立的服务组成，并在Kubernetes环境中通过Helm Chart进行部署。Analyzer通过异步工作池、重复分析防止、上下文溢出恢复机制等设计，确保在大规模日志处理时也能稳定运行。Vectors通过模板提取去除日志的重复性，并通过OpenAI嵌入后存储在Milvus中，实现高效的语义搜索。
