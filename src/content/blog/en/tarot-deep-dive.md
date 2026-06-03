---
title: 'Tarot Core: Caching Strategy for AI Tarot Service'
description: >-
  Caching design for a tarot service that optimizes OpenAI API costs and
  response speed while providing a fresh experience each time
pubDate: '2026-06-02T00:00:00.000Z'
tags:
  - TypeScript
  - NestJS
  - OpenAI
  - Redis
  - Caching
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png'
---
## Problem Awareness

AI-generated content is always new, but calling the API for the same input each time accumulates costs. This is especially true for tarot readings. Even if the same card appears, a different interpretation should be provided each time to keep users engaged. However, calling the OpenAI API every time will soon lead to a cost explosion.

Tarot Core resolves this dilemma with a bucket system. By creating cache keys with 78 cards x 2 directions x 10 buckets = 1,560 unique combinations, the same combination is instantly returned from Valkey, and JSON response format is enforced with Structured Outputs, optimizing both costs and latency.

## Buckets: Balancing Diversity and Efficiency

78 cards x 2 directions x 10 buckets = 1,560 unique combinations. One of these is randomly selected each time a user makes a request. The cache key is in the form `tarot:read:{card}:{direction}:{bucket}`, and subsequent requests with the same key are instantly returned from Valkey. The OpenAI API is only called when not present in the cache.

Keywords are not included in the cache key. Even if the same bucket is selected, different keywords result in AI generating readings in different contexts. This design saves cache space while preventing monotony.

```mermaid
flowchart LR
    subgraph "Random Selection"
        Card[78 Cards]
        Dir[Upright/Reversed]
        Bucket[Bucket 1~10]
        Keywords[4 Keywords]
    end

    subgraph "Cache Key"
        Key["tarot:read:{card}:{dir}:{bucket}"]
    end

    Card --> Key
    Dir --> Key
    Bucket --> Key
    Key --> Valkey[(Valkey)]
    Keywords -.->|Set Reading Direction| OpenAI[OpenAI API]
```

## Structured Outputs: Consistency in Response Format

The most troublesome aspect of using the OpenAI API is the consistency of response format. Tarot Core preemptively addresses this issue with the Structured Outputs API. By passing a Zod schema, the OpenAI API enforces JSON format, eliminating client-side parsing errors.

```typescript
export const ReadResponseSchema = z.object({
  title: z.string().min(1), // English card name
  titleKR: z.string().min(1), // Korean card name
  keywords: z.array(z.string()).min(1),
  advice: z.string().min(1), // Advice message
});
```

The system prompt includes constraints such as "cold and natural like a fortune teller" and "no special characters." Card information and 4 keywords are delivered in JSON in the user message, allowing AI to understand the context.

Even in case of cache server failure, the service does not stop. All cache calls are wrapped in try/catch, treating lookup failures as cache misses and quietly ignoring storage failures. When Valkey is down, it gracefully switches to direct OpenAI calls.

```mermaid
sequenceDiagram
    participant Client as Client
    participant Service as TarotService
    participant Cache as Valkey
    participant AI as OpenAI

    Client->>Service: Request Tarot Reading
    Service->>Service: Randomly Select Card/Direction/Bucket/Keywords
    Service->>Cache: Cache Lookup

    alt Cache Hit
        Cache-->>Service: Return Stored Result
    else Cache Miss
        Service->>AI: Request Structured Output
        AI-->>Service: {title, titleKR, keywords, advice}
        Service->>Cache: Store Result (Ignore on Failure)
    end

    Service-->>Client: Reading Result
```

## Module Design and Deployment

The design is intentionally simple. There is no database, and the card deck and keyword pool are all hardcoded in memory. The NestJS module structure consists of ConfigModule → ValkeyModule (global) → TarotModule, with TarotService handling all business logic. This simplicity reduces code volume and eases testing.

Configuration is managed in two layers: YAML files and environment variables. Basic settings are loaded with js-yaml and overridden by six environment variables, including OPENAI_API_KEY. Zod schema handles both default values and validation simultaneously.

The Dockerfile uses a three-stage multi-stage build, and the Helm Chart operates with a default of 2 replicas, automatically scaling from 2 to 10 via HPA. In the security context, non-root execution, seccomp profile application, and removal of all capabilities are implemented.

## Room for Improvement

Currently, keywords are not included in the cache key, so if a cache hit occurs with only different keywords in the same bucket, an unintended reading may be delivered. This is intentional by design, but without cache warming, OpenAI calls are concentrated during cold starts. We are considering pre-generating popular combinations in the future.

## Conclusion

Tarot Core demonstrates a balance between caching and AI generation, reliable response formats created with Structured Outputs, and modern deployment using NestJS and Kubernetes. It stands out as a design that considers both cost and performance in a real operational environment, not just a simple toy.
