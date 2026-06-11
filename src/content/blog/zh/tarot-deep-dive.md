---
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - TypeScript
  - NestJS
  - OpenAI
  - Redis
  - Caching
lang: zh
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png'
title: 塔罗牌：AI塔罗解读服务的缓存设计与实现
description: OpenAI API费用和响应速度优化的同时，每次都提供新体验的塔罗服务缓存设计
---
```markdown
## 问题意识

AI生成的内容每次都是新的，这是一大优点，但如果对同一输入每次都调用API，成本会迅速累积。塔罗牌服务也是如此。
虽然使用OpenAI API进行卡牌解读，但由于成本和响应速度问题，对每个请求调用API并不现实。

然而，仅仅依靠卡牌和方向作为缓存键是不够的。用户即使抽到相同的卡牌，也期待每次有不同的解读。
为缩小这一差距，我们引入了**利用桶系统的缓存策略**。

---

## 桶：多样性与效率的平衡

核心思想很简单。通过组合78张卡牌、正/逆方向和10个桶，创建**1,560个唯一缓存键**，并为每个键存储AI生成的解读。

```
78张 × 2方向 × 10桶 = 1,560个唯一组合
```

每当用户请求时，会随机选择这些组合中的一个。缓存键的形式为`tarot:read:{card}:{direction}:{bucket}`，对于相同键的后续请求，Valkey会立即返回。
只有在缓存中没有时才调用OpenAI API。

我们还增加了一项措施。服务器每次请求时随机选择4个关键词，并将其作为上下文传递给AI。
因此，即使是相同的卡牌、方向和桶，根据关键词也可能产生不同的解读。

```mermaid
flowchart LR
    subgraph RandomSelect["随机选择"]
        Card[78张卡牌]
        Dir[正/逆方向]
        Bucket[桶 1~10]
        Keywords[4个关键词]
    end
    
    subgraph CacheKey["缓存键"]
        Key["tarot:read:{card}:{dir}:{bucket}"]
    end
    
    Card --> Key
    Dir --> Key
    Bucket --> Key
    
    Key --> Valkey[(Valkey)]
    Key -.->|缓存未命中| OpenAI[OpenAI API]
    Keywords -.->|解读方向| OpenAI

```

将整个流程用序列图表示如下。

```mermaid
sequenceDiagram
    autonumber
    
    actor Client as 客户端
    participant Service as TarotService
    participant Cache as Valkey
    participant AI as OpenAI
    
    Client->>Service: 请求塔罗解读
    Note over Service: 随机选择卡牌/方向/桶
    
    Service->>Cache: 查询缓存 (`GET`)
    
    alt 缓存命中 (Hit)
        Cache-->>Service: 返回存储结果
    else 缓存未命中 (Miss)
        Service->>AI: 调用OpenAI API
        AI-->>Service: 返回解读结果 ({advice})
        Note over Service: 数据组合<br/>(card.name / card.nameKR / keywords)
        Service->>Cache: 存储结果 (`SET`)
    end
    
    Service-->>Client: 返回最终解读结果

```

---

## 部署

前端使用Vercel，后端在家庭Kubernetes集群上运行。

```mermaid
flowchart TD
    subgraph Front["Vercel"]
        Vercel[塔罗牌 Next.js 应用]
    end
    
    subgraph CICD["CI / CD"]
        GH[GitHub]
        Actions[GitHub Actions]
        Harbor[(Harbor)]
        ArgoCD[ArgoCD]
        S3[(S3)]
    end
    
    subgraph K8s["家庭K8s集群"]
        GW[Gateway API]
        Service[塔罗牌服务]
        HPA[HPA: 2~10副本]
    end

    %% 部署管道流程
    GH -->|Git版本标签推送 v*.*.*| Actions
    Actions -->|镜像构建/推送| Harbor
    Harbor -->|镜像存储| S3
    Harbor -->|镜像引用| ArgoCD
    ArgoCD -->|GitOps部署| Service

    %% 前端管道流程
    Actions -->|前端构建/部署| Vercel
    
    %% 流量流程
    Vercel --> |外部流量| GW
    GW -->|路由| Service
    Service -->|自动扩展| HPA

```

部署管道在GitHub上**新版本标签(`v*.*.*`)推送时**自动启动。
GitHub Actions基于该标签构建镜像并推送到内部容器注册表Harbor，
ArgoCD通过GitOps设置检测到变更后自动同步集群状态。
此外，前端由GitHub Actions直接构建并部署到Vercel。

后端通过HPA根据流量自动扩展至2~10个副本，
来自外部的用户请求通过内部Gateway API安全路由。

---

## 改进空间

目前是一个无需登录即可使用的简单服务，
但我们计划添加登录功能，以便保存用户的解读历史并提供个性化体验。

---

## 结语

塔罗牌服务虽然是个小项目，但包含了解决AI生成与缓存平衡的实际问题。
利用桶系统的缓存策略在成本和多样性之间提供了现实的折中方案，并且有足够的改进空间。
```
