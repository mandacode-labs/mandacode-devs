---
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - TypeScript
  - NestJS
  - OpenAI
  - Redis
  - Caching
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png'
title: 'Tarot Cards: Design and Implementation of Caching for AI Tarot Reading Service'
description: >-
  The caching design of the tarot service that optimizes OpenAI API costs and
  response speed while providing a new experience each time.
---
## Problem Awareness

The advantage of AI-generated content is that it's always new, but calling the API repeatedly for the same input can quickly accumulate costs. This is also true for tarot card services. Although we use the OpenAI API for card readings, due to cost and response time issues, it's not practical to call the API for every request.

A simple cache using only the card and direction as keys is insufficient. Users expect different readings even if they draw the same card. To bridge this gap, we introduced a **caching strategy using a bucket system**.

---

## Buckets: Balancing Diversity and Efficiency

The core idea is simple. By combining 78 cards, upright/reversed directions, and 10 buckets, we create **1,560 unique cache keys** and store AI-generated readings for each key.

```
78 cards × 2 directions × 10 buckets = 1,560 unique combinations
```

Each time a user makes a request, one of these combinations is randomly selected. The cache key is in the form `tarot:read:{card}:{direction}:{bucket}`, and subsequent requests with the same key are immediately returned from Valkey. The OpenAI API is only called when there is a cache miss.

We've added one more mechanism. The server randomly selects 4 keywords for each request and provides them to the AI as context. This allows for different readings even with the same card, direction, and bucket, depending on the keywords.

```mermaid
flowchart LR
    subgraph RandomSelect["Random Selection"]
        Card[78 Cards]
        Dir[Upright/Reversed]
        Bucket[Bucket 1~10]
        Keywords[4 Keywords]
    end
    
    subgraph CacheKey["Cache Key"]
        Key["tarot:read:{card}:{dir}:{bucket}"]
    end
    
    Card --> Key
    Dir --> Key
    Bucket --> Key
    
    Key --> Valkey[(Valkey)]
    Key -.->|Cache Miss| OpenAI[OpenAI API]
    Keywords -.->|Reading Direction| OpenAI

```

The entire flow can be represented in a sequence diagram as follows.

```mermaid
sequenceDiagram
    autonumber
    
    actor Client as Client
    participant Service as TarotService
    participant Cache as Valkey
    participant AI as OpenAI
    
    Client->>Service: Request Tarot Reading
    Note over Service: Randomly select card / direction / bucket / keywords
    
    Service->>Cache: Cache Lookup (`GET`)
    
    alt Cache Hit
        Cache-->>Service: Return stored result
    else Cache Miss
        Service->>AI: Call OpenAI API
        AI-->>Service: Return reading result ({advice})
        Note over Service: Combine data<br/>(card.name / card.nameKR / keywords)
        Service->>Cache: Store result (`SET`)
    end
    
    Service-->>Client: Respond with final reading result

```

---

## Deployment

The frontend is operated on Vercel, and the backend is run on a home Kubernetes cluster.

```mermaid
flowchart TD
    subgraph Front["Frontend"]
        Vercel[Vercel]
    end
    
    subgraph CICD["CI / CD"]
        GH[GitHub]
        Actions[GitHub Actions]
        Harbor[(Harbor)]
        ArgoCD[ArgoCD]
    end
    
    subgraph K8s["Backend: Home K8s Cluster"]
        Tunnel[Cloudflare Tunnel]
        GW[Gateway API]
        Service[K8s Service]
        HPA[HPA: 2~10 Replicas]
    end

    %% Pipeline Flow
    GH -->|Push Git Version Tag v*.*.*| Actions
    Actions -->|Build/Push Image| Harbor
    Harbor -->|Image Reference| ArgoCD
    ArgoCD -->|GitOps Deployment| Service
    
    %% Traffic Flow
    Vercel -->|API Request| Tunnel
    Tunnel -->|External Traffic| GW
    GW -->|Routing| Service
    Service -->|Auto Scaling| HPA

```

The deployment pipeline automatically starts **as soon as a new version tag (`v*.*.*`) is pushed to GitHub**. GitHub Actions builds the image based on the tag and pushes it to the in-house container registry, Harbor. ArgoCD detects changes through GitOps settings and automatically synchronizes the cluster state.

The backend automatically scales from 2 to 10 replicas based on traffic via HPA, and user requests coming from outside are safely routed through the Cloudflare Tunnel to the internal Gateway API.

---

## Areas for Improvement

There is an intentional trade-off in the current design. Since keywords are not included in the cache key, even if only the keywords differ in the same bucket, a cache hit may return an unintended reading. This design choice prioritizes cache efficiency over diversity.

Another challenge is the cold start. Without cache warming in the current structure, initial requests may concentrate OpenAI calls. We plan to mitigate this by pre-generating popular combinations in the future.

Currently, the service is simple and available to anyone without login, but we are considering adding a login feature to save user-specific reading history and provide a personalized experience.

---

## Conclusion

The tarot card service is a small project, but it involves solving practical problems of balancing AI generation and caching. The caching strategy using a bucket system offers a realistic compromise between cost and diversity, with ample room for future improvements.
