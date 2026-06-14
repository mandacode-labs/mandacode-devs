---
title: "Retrowin: S3の上にPOSIXファイルシステムを載せる"
description: オブジェクトストレージの拡張性とPOSIXの利便性を結合したRetrowinの設計哲学と技術的決定
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Go
  - S3
  - Filesystem
  - Keycloak
  - PostgreSQL
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
---

## 問題意識

S3は優れた耐久性と拡張性を提供しますが、開発者が直接扱うには依然として複雑です。ディレクトリがなく、権限管理が粗く、大容量ファイルのアップロードは自分で実装する必要があります。

RetrowinはS3の拡張性を維持しつつ、POSIXファイルシステムインターフェースを提供するシステムです。InodeとDentryをPostgreSQLにJSONとして保存し、ジョインなしでディレクトリの参照が可能で、仮URLベースの2段階アップロードで大容量ファイルも効率的に処理します。さらにWindows XPスタイルのレトロUIを加え、技術的挑戦と楽しさを同時に追求しました。

## 核心設計: inodeとdentryの現代的再解釈

最大の設計上の質問は「ファイルシステムの階層構造をリレーショナルDBにどう表現するか？」でした。Linuxのinodeとdentryの概念を借用しましたが、現代的に再解釈しました。

Inodeテーブルはファイルメタデータを保存し、Dentryはディレクトリ内のファイル名とInode IDのマッピングを管理します。興味深い決定は、Dentryを別テーブルではなくInodeのcontentカラムにJSONとして保存したことです。ディレクトリ参照時にジョインなしで単一行を読むだけで済むため、遅延時間が短く、PostgreSQLのJSONBインデックスを活用できます。欠点はディレクトリ修正時に全JSONを書き直す必要があることですが、ほとんどのディレクトリは数百個以下のファイルしか持たないため、このオーバーヘッドは微々たるものです。

```mermaid
graph TB
    subgraph "リクエストフロー"
        Client[クライアント] -- HTTP --> Handler[HTTP Handler]
        Handler --> FsService[FsService]
        FsService --> InodeService[InodeService]
        FsService --> DentryService[DentryService]
        FsService --> ObjectService[ObjectService]
        InodeService -- SQL --> PostgreSQL
        ObjectService -- S3 API --> S3
    end
```

## 大容量ファイルアップロード: 仮URLとアトミック完了

サーバーを経由してS3にファイルをプロキシすると、帯域幅とメモリがボトルネックになります。Retrowinは仮URLベースの2段階アップロードでこの問題を解決します。

クライアントがアップロードを要求すると、サーバーはDBに待機状態レコードを生成し、S3仮URLを発行します。クライアントはこのURLで直接S3にアップロードします。完了後、サーバーに通知すると、PostgreSQLトランザクション内でS3存在確認、状態活性化転換、Inode生成、Dentry接続をアトミックに実行します。冪等性キーもサポートし、同一アップロード要求の再試行時に既存レコードを再利用します。

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant API as APIサーバー
    participant DB as PostgreSQL
    participant S3 as S3/MinIO

    Client->>API: アップロード開始要求
    API->>DB: 待機状態オブジェクト生成
    API->>S3: 仮URL発行
    API-->>Client: {オブジェクトID, 仮URL}

    Note over Client,S3: クライアントが直接S3にアップロード

    Client->>API: アップロード完了通知
    API->>DB: BEGIN TRANSACTION
    API->>S3: オブジェクト存在確認
    API->>DB: 状態活性化、Inode生成、Dentry接続
    API->>DB: COMMIT
    API-->>Client: 完了
```

### アトミックアップロードの核心

```go
func (s *FsService) AtomicUpload(ctx context.Context, objectID string) error {
    return s.db.WithTx(ctx, func(tx *sql.Tx) error {
        // 1. S3オブジェクト存在確認
        if err := s.s3.HeadObject(objectID); err != nil {
            return err
        }
        // 2. 状態活性化
        if err := s.objectSvc.CompleteUpload(ctx, tx, objectID); err != nil {
            return err
        }
        // 3. Inode生成 + Dentry接続
        inode, err := s.inodeSvc.Create(ctx, tx, objectID)
        if err != nil {
            return err
        }
        return s.dentrySvc.Link(ctx, tx, inode)
    })
}
```

トランザクション内で全ての作業がアトミックに行われるため、途中で失敗してもデータが不一致になることはありません。

## 認証と権限: 標準に従う

ファイルシステムは権限管理が命です。KeycloakをOIDCプロバイダーとして使用し、標準化された認証フローに従います。PKCEを適用し、モバイルとデスクトップクライアントでも安全に認証できるようにし、OIDCクライアントは遅延初期化され、Keycloakが一時的に停止してもサーバー起動が止まりません。

ファイル権限は標準Unixパーミッションビットに従います。所有者、グループ、その他のユーザー別に読み/書き/実行権限を制御し、rootは全ての作業が可能です。

| 権限主体         | 読み | 書き | 実行 |
| ---------------- | ---- | ---- | ---- |
| 所有者 (Owner)   | ✅   | ✅   | ✅   |
| グループ (Group) | ✅   | ❌   | ✅   |
| その他 (Other)   | ❌   | ❌   | ❌   |

## ガベージコレクション

時間が経つとアップロードが完了していない待機ファイルやS3では削除されたがDBには残っている孤児レコードが生じます。Kubernetes CronJobで毎日午前3時に2段階クリーンアップを実行します。まず24時間以上待機中の期限切れオブジェクトを削除し、次にDBには活性として表示されるがS3に存在しない孤児オブジェクトを探して整理します。

## トレードオフと教訓

JSONベースのDentryは参照性能を高めますが、ディレクトリ同時修正のためのロックがインメモリベースであるため、水平拡張時に限界があります。また、シンボリックリンク解決が再帰的でサイクル検出がないため、リンクループに脆弱です。しかし、単一ユーザーや小規模チーム環境ではこのトレードオフは許容可能で、シンプルさがもたらす運用上の利点が大きいです。

## 終わりに

Retrowinはオブジェクトストレージの拡張性とPOSIXファイルシステムの親しみやすさを結合した興味深い実験です。アトミックアップロード、OIDC認証、GCまで実際の運用環境を考慮した要素を含みつつ、Ent ORMやogenといったGoエコシステムの現代的ツールを積極的に活用しました。レトロUIは技術的挑戦と楽しさを同時に追求するこのプロジェクトのアイデンティティをよく示しています。
