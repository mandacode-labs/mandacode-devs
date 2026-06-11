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

The advantage of AI-generated content is its novelty each time, but repeatedly calling the API for the same input can quickly accumulate costs. This is also true for tarot card services. While we use the OpenAI API for card readings, calling the API for every request is not feasible due to cost and response time issues.

A simple cache using only the card and direction as keys is insufficient, as users expect different readings even if they draw the same card. To bridge this gap, we introduced a **caching strategy utilizing a bucket system**.

---

## Buckets: Balancing Diversity and Efficiency

The core idea is simple. By combining 78 cards, upright/reversed directions, and 10 buckets, we create **1,560 unique cache keys** and store AI-generated readings for each key.

```
78 cards × 2 directions × 10 buckets = 1,560 unique combinations
```

Each time a user makes a request, one of these combinations is randomly selected. The cache key is in the format `tarot:read:{card}:{direction}:{bucket}`, and subsequent requests with the same key are immediately returned from Valkey. The OpenAI API is only called when there is no cache.

Additionally, the server randomly selects 4 keywords with each request and provides them to the AI as context. This allows for different readings based on the keywords, even with the same card, direction, and bucket.

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
    Note over Service: Randomly select card / direction / bucket
    
    Service->>Cache: Check Cache (`GET`)
    
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
    subgraph Front["Vercel"]
        Vercel[Tarot Card Next.js App]
    end
    
    subgraph CICD["CI / CD"]
        GH[GitHub]
        Actions[GitHub Actions]
        Harbor[(Harbor)]
        ArgoCD[ArgoCD]
        S3[(S3)]
    end
    
    subgraph K8s["Home K8s Cluster"]
        GW[Gateway API]
        Service[Tarot Card Service]
        HPA[HPA: 2~10 Replicas]
    end

    %% Deployment pipeline flow
    GH -->|Push Git version tag v*.*.*| Actions
    Actions -->|Build/Push Image| Harbor
    Harbor -->|Store Image| S3
    Harbor -->|Reference Image| ArgoCD
    ArgoCD -->|GitOps Deployment| Service

    %% Frontend pipeline flow
    Actions -->|Build/Deploy Frontend| Vercel
    
    %% Traffic flow
    Vercel --> |External Traffic| GW
    GW -->|Routing| Service
    Service -->|Auto Scaling| HPA

```

The deployment pipeline automatically starts **as soon as a new version tag (`v*.*.*`) is pushed to GitHub**. GitHub Actions builds the image based on the tag and pushes it to the in-house container registry, Harbor. ArgoCD detects changes through GitOps settings and automatically synchronizes the cluster state. Additionally, the frontend is directly built and deployed to Vercel via GitHub Actions.

The backend automatically scales from 2 to 10 replicas based on traffic through HPA, and external user requests are safely routed through the internal Gateway API.

---

## Room for Improvement

Currently, it is a simple service accessible to anyone without login, but we are considering adding a login feature to store user-specific reading history and provide a personalized experience.

---

## Conclusion

The tarot card service is a small project, but it involves solving practical issues of balancing AI generation and caching. The caching strategy using the bucket system offers a realistic compromise between cost and diversity, with ample room for future improvements.
