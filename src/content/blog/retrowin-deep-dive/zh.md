---
title: "Retrowin: 在 S3 上构建 POSIX 文件系统"
description: 结合对象存储的可扩展性和POSIX的便利性，Retrowin的设计理念和技术决策
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Go
  - S3
  - Filesystem
  - Keycloak
  - PostgreSQL
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
---

## 问题意识

S3 提供了出色的耐用性和可扩展性，但对于开发者来说仍然相对复杂。没有目录，权限管理粗糙，且需要自行实现大文件上传。

Retrowin 是一个在保持 S3 可扩展性的同时提供 POSIX 文件系统接口的系统。通过将 Inode 和 Dentry 以 JSON 格式存储在 PostgreSQL 中，无需连接即可查询目录，并通过基于临时 URL 的两阶段上传高效处理大文件。此外，还添加了 Windows XP 风格的复古 UI，追求技术挑战和乐趣。

## 核心设计：inode 和 dentry 的现代化再解释

最大的设计问题是“如何在关系型数据库中表示文件系统的层次结构？”我们借用了 Linux 的 inode 和 dentry 概念，但进行了现代化的再解释。

Inode 表存储文件元数据，而 Dentry 管理目录中文件名与 Inode ID 的映射。有趣的决定是将 Dentry 以 JSON 格式存储在 Inode 的 content 列中，而不是单独的表中。这样在查询目录时无需连接，只需读取单行，延迟较低，并且可以利用 PostgreSQL 的 JSONB 索引。缺点是修改目录时需要重新写入整个 JSON，但大多数目录的文件数不超过几百个，因此这个开销很小。

```mermaid
graph TB
    subgraph "请求流程"
        Client[客户端] -- HTTP --> Handler[HTTP Handler]
        Handler --> FsService[FsService]
        FsService --> InodeService[InodeService]
        FsService --> DentryService[DentryService]
        FsService --> ObjectService[ObjectService]
        InodeService -- SQL --> PostgreSQL
        ObjectService -- S3 API --> S3
    end
```

## 大文件上传：临时 URL 和原子完成

通过服务器代理文件到 S3 会导致带宽和内存瓶颈。Retrowin 通过基于临时 URL 的两阶段上传解决了这个问题。

当客户端请求上传时，服务器在数据库中创建待处理状态的记录并发放 S3 临时 URL。客户端直接使用该 URL 上传到 S3。上传完成后通知服务器，在 PostgreSQL 事务中原子地执行 S3 存在检查、状态激活转换、Inode 创建、Dentry 连接。还支持幂等键，以便在重试相同上传请求时重用现有记录。

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API 服务器
    participant DB as PostgreSQL
    participant S3 as S3/MinIO

    Client->>API: 请求开始上传
    API->>DB: 创建待处理对象
    API->>S3: 发放临时 URL
    API-->>Client: {对象ID, 临时URL}

    Note over Client,S3: 客户端直接上传到 S3

    Client->>API: 上传完成通知
    API->>DB: BEGIN TRANSACTION
    API->>S3: 检查对象存在
    API->>DB: 激活状态, 创建 Inode, 连接 Dentry
    API->>DB: COMMIT
    API-->>Client: 完成
```

### 原子上传的核心

```go
func (s *FsService) AtomicUpload(ctx context.Context, objectID string) error {
    return s.db.WithTx(ctx, func(tx *sql.Tx) error {
        // 1. 检查 S3 对象存在
        if err := s.s3.HeadObject(objectID); err != nil {
            return err
        }
        // 2. 激活状态
        if err := s.objectSvc.CompleteUpload(ctx, tx, objectID); err != nil {
            return err
        }
        // 3. 创建 Inode + 连接 Dentry
        inode, err := s.inodeSvc.Create(ctx, tx, objectID)
        if err != nil {
            return err
        }
        return s.dentrySvc.Link(ctx, tx, inode)
    })
}
```

在事务中所有操作都是原子执行的，因此即使中途失败也不会导致数据不一致。

## 认证和权限：遵循标准

文件系统的生命在于权限管理。我们使用 Keycloak 作为 OIDC 提供者，遵循标准化的认证流程。通过应用 PKCE，可以在移动和桌面客户端中安全认证，OIDC 客户端延迟初始化，即使 Keycloak 短暂宕机也不会阻止服务器启动。

文件权限遵循标准的 Unix 权限位。通过所有者、组、其他用户分别控制读/写/执行权限，root 可以执行所有操作。

| 权限主体       | 读  | 写  | 执行 |
| -------------- | --- | --- | ---- |
| 所有者 (Owner) | ✅  | ✅  | ✅   |
| 组 (Group)     | ✅  | ❌  | ✅   |
| 其他 (Other)   | ❌  | ❌  | ❌   |

## 垃圾回收

随着时间的推移，会出现未完成上传的待处理文件或在 S3 中已删除但在数据库中仍存在的孤立记录。通过 Kubernetes CronJob 每天凌晨 3 点执行两阶段清理。首先删除超过 24 小时的待处理过期对象，然后查找在数据库中标记为激活但在 S3 中不存在的孤立对象进行清理。

## 权衡与教训

基于 JSON 的 Dentry 提高了查询性能，但用于目录并发修改的锁是基于内存的，因此在水平扩展时存在限制。此外，符号链接解析是递归的，没有循环检测，容易受到链接循环的影响。但在单用户或小团队环境中，这些权衡是可以接受的，简单性带来的运营优势更大。

## 结语

Retrowin 是一个结合对象存储的可扩展性和 POSIX 文件系统熟悉性的有趣实验。包括原子上传、OIDC 认证、GC 等考虑实际运营环境的元素，同时积极利用 Ent ORM 和 ogen 等 Go 生态系统的现代工具。复古 UI 展现了这个项目追求技术挑战和乐趣的身份。
