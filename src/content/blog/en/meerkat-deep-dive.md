---
title: 'Meerkat: Transforming Log Analysis Paradigms with AI Agents'
description: >-
  Beyond the limitations of rule-based alerts, the design philosophy and
  implementation story of Meerkat, where AI Agents directly analyze
  infrastructure
pubDate: '2026-06-02T00:00:00.000Z'
tags:
  - Go
  - AI
  - Observability
  - OpenTelemetry
  - RAG
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png'
---
## Problem Awareness

PagerDuty alerts ringing in the middle of the night. "CPU exceeds 90%." Waking up to check the dashboard, you find that a batch job running since yesterday is the cause and will automatically decrease in 30 minutes. Accumulating such false alerts can desensitize you to real issues when they arise.

Meerkat was initiated to fundamentally solve this problem. Instead of rule-based alerts, AI Agents directly read logs and metrics, invoking tools like Prometheus and Loki to deduce causes. Logs are vectorized and stored for semantic search, and the system is divided into two services, Analyzer and Vectors, allowing independent scaling.

## Core Design: Two Services, Two Responsibilities

Meerkat consists of two services, Analyzer and Vectors. This separation is an intentional design.

**Vectors** focuses solely on meaningfully storing logs. Logs received via OpenTelemetry OTLP undergo template extraction to remove duplicates and are stored as vectors in Milvus after OpenAI embedding. Even if a service logs tens of thousands of entries daily, only a few unique templates are vectorized, significantly improving storage costs and search efficiency.

**Analyzer** focuses solely on AI analysis and worker management. It processes requests received via HTTP API in an asynchronous worker pool and requests semantic searches from Vectors if necessary. The two services communicate via gRPC and can scale out independently.

```mermaid
graph LR
    subgraph "Data Flow"
        App[Application] -- OTLP Logs --> Vectors
        Vectors -- Embedding Storage --> Milvus[(Milvus)]
        Client[User/Webhook] -- Analysis Request --> Analyzer
        Analyzer -- Semantic Search --> Vectors
        Analyzer -- Metric/Log Query --> Prometheus
        Analyzer -- LLM Call --> OpenAI
    end
```

### Effects of Template Extraction

| Filter Mode         | Operation                     | Use Case                      |
| ------------------- | ----------------------------- | ----------------------------- |
| **all**             | Vectorize all logs            | Small-scale services, development environments |
| **severity**        | Process only above a specified level | Production environments, error-focused monitoring |
| **template** (default) | Remove duplicates with Drain algorithm | Large-scale services, cost optimization |

## AI Utilizing Tools

The core of Analyzer is providing tools to the LLM and allowing it to use them independently. It offers four tools: Prometheus, Loki, VictoriaLogs queries, and Vectors semantic search.

When a request like "Analyze the error spike" comes in, the flow is as follows. First, it searches for recent error logs of the service in Vectors, checks the error rate trend in Prometheus, and analyzes the frequency of specific error messages in Loki. It then synthesizes the information to conclude, "Error spike due to Redis connection timeout, started at 14:23 and automatically recovered at 14:45."

Tool results are limited to 30,000 characters, and errors are categorized into query syntax errors, connection failures, and query failures. The LLM makes judgments like "My query was wrong, let's fix it and retry" or "Prometheus isn't responding, let's switch to Loki."

```mermaid
sequenceDiagram
    participant User as User
    participant Analyzer as Analyzer
    participant LLM as LLM
    participant Tools as Tools

    User->>Analyzer: Analysis Request
    Analyzer->>LLM: Context + List of Available Tools

    loop Agent Loop
        LLM-->>Analyzer: Tool Call or Final Answer

        alt Tool Call
            Analyzer->>Tools: Prometheus/Loki/Vectors Query
            Tools-->>Analyzer: Result
        else Final Answer
            Analyzer-->>User: Analysis Complete
        end
    end
```

## Considerations in Production Environment

The worker pool is configured with a buffered channel size of 1000 and 10 workers. If the queue is full, a 429 error is immediately returned to provide backpressure. Duplicate analyses for the same trigger and query are automatically blocked within a 5-minute window.

Deployment is managed with Helm Charts, with ConfigMap storing configurations and system prompts, and Secret storing API keys and DB passwords separately. However, since the worker pool's queue is an in-memory channel, queued tasks are lost upon server restart. We plan to implement a persistent queue in the future.

## Conclusion

Meerkat goes beyond merely calling LLM APIs. By combining an AI Agent architecture that uses tools, semantic-based log search, and a controllable asynchronous worker pool, it creates a platform usable in real production environments. For teams hitting the limits of rule-based alerts, it offers a new observability possibility where they can understand infrastructure situations with a single natural language command. This is the value this project aims to pursue.
