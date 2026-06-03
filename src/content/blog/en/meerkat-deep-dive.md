---
title: 'Meerkat: Transforming Log Analysis with AI Agents'
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

The PagerDuty alert ringing in the middle of the night: "CPU exceeds 90%."
Upon checking the dashboard after waking up, it turns out the batch job running since yesterday was the cause, and it is expected to decrease automatically in 30 minutes.
Accumulation of such false alerts desensitizes you to real problems.

Meerkat was initiated to fundamentally solve this issue.
Instead of rule-based alerts, an AI Agent directly reads logs and metrics,
calls tools like Prometheus and Loki, and infers the cause.
Logs are vectorized and stored for semantic search,
and the system is divided into two services, Analyzer and Vectors, allowing independent scaling.

## Core Design: Two Services, Two Responsibilities

Meerkat consists of two services: Analyzer and Vectors.
This separation is an intentional design.

**Vectors** focuses solely on receiving and meaningfully storing logs.
Logs received via OpenTelemetry OTLP are deduplicated through template extraction,
embedded with OpenAI, and stored as vectors in Milvus.
Even if a service logs tens of thousands of entries a day, only a few unique templates are vectorized, significantly improving storage costs and search efficiency.

**Analyzer** focuses solely on AI analysis and worker management.
It processes requests received via HTTP API in an asynchronous worker pool,
and requests semantic searches from Vectors if necessary.
The two services communicate via gRPC and can scale out independently.

```mermaid
graph LR
    subgraph "Data Flow"
        App[Application] -- OTLP Logs --> Vectors
        Vectors -- Embed Storage --> Milvus[(Milvus)]
        Client[User/Webhook] -- Analysis Request --> Analyzer
        Analyzer -- Semantic Search --> Vectors
        Analyzer -- Metric/Log Query --> Prometheus
        Analyzer -- LLM Call --> OpenAI
    end
```

### Effects of Template Extraction

| Filter Mode           | Operation                     | Use Case                     |
| ------------------- | ---------------------------- | ----------------------------- |
| **all**             | Vectorize all logs           | Small-scale services, development environments      |
| **severity**        | Process only above a certain level        | Production environments, error-focused monitoring |
| **template** (default) | Deduplicate with Drain algorithm | Large-scale services, cost optimization    |

## AI Using Tools

The core of Analyzer is providing tools to the LLM and allowing it to use them independently.
It offers four tools: Prometheus, Loki, VictoriaLogs queries, and Vectors semantic search.

When a request like "Analyze the error spike" comes in, the flow is as follows.
First, it searches for recent error logs of the service in Vectors,
checks the error rate trend in Prometheus,
and analyzes the frequency of specific error messages in Loki.
Then, it synthesizes the information to draw conclusions like "Error spike due to Redis connection timeout, started at 14:23 and auto-recovered at 14:45."

Tool results are limited to 30,000 characters,
and errors are categorized into query syntax errors, connection failures, and query failures.
The LLM makes judgments like "My query is wrong, so I'll fix it and try again" or "Prometheus isn't responding, let's switch to Loki."

```mermaid
sequenceDiagram
    participant User as User
    participant Analyzer as Analyzer
    participant LLM as LLM
    participant Tools as Tools

    User->>Analyzer: Analysis Request
    Analyzer->>LLM: Context + Available Tool List

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

The worker pool is configured with a buffered channel size of 1000 and 10 workers.
If the queue is full, it immediately returns a 429 error to provide backpressure.
Duplicate analyses for the same trigger and query are automatically blocked within a 5-minute window.

Deployment is managed with Helm Chart,
and ConfigMap stores configurations and system prompts,
while Secret stores API keys and DB passwords separately.
However, since the worker pool's queue is an in-memory channel,
queued tasks are lost upon server restart.
We plan to implement a persistent queue in the future.

## Conclusion

Meerkat goes beyond simply calling LLM APIs.
By combining an AI Agent architecture that uses tools, semantic-based log search,
and a controllable asynchronous worker pool,
we have created a platform usable in real production environments.
For teams hitting the limits of rule-based alerts,
it offers a new observability possibility where infrastructure situations can be understood with a single natural language phrase, which is the value this project pursues.
