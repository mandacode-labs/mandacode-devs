---
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - TypeScript
  - NestJS
  - OpenAI
  - Redis
  - Caching
lang: ja
coverImage: "https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png"
title: "タロットカード: AIタロットリーディングサービスのキャッシング設計と実装"
description: OpenAI APIの費用と応答速度を最適化しつつ、毎回新しい体験を提供するタロサービスのキャッシュ設計
---

```markdown
## 問題意識

AIが生成するコンテンツは毎回新しいというのが利点ですが、同じ入力に対して毎回APIを呼び出すと、コストがすぐに積み重なります。タロットカードサービスも同様です。
カードリーディングのためにOpenAI APIを使用していますが、コストと応答速度の問題から、すべてのリクエストにAPIを呼び出すのは現実的ではありません。

だからといって、単純にカードと方向だけをキーにしたキャッシュでは不十分です。ユーザーは同じカードを引いても毎回異なるリーディングを期待するからです。
このギャップを埋めるために導入したのが、**バケットシステムを活用したキャッシング戦略**です。

---

## バケット: 多様性と効率のバランス

核心アイデアは簡単です。78枚のカード、正位置/逆位置、そして10個のバケットを組み合わせて、**1,560個のユニークなキャッシュキー**を作り、各キーに対してAIが生成したリーディングを保存しておくことです。
```

78枚 × 2方向 × 10バケット = 1,560個のユニークな組み合わせ

````

ユーザーがリクエストするたびに、この組み合わせの中から1つがランダムに選ばれます。キャッシュキーは `tarot:read:{card}:{direction}:{bucket}` の形式で、同じキーで入ってくる後続のリクエストはValkeyから即座に返されます。
キャッシュにない場合のみOpenAI APIを呼び出します。

ここにもう一つの仕掛けを加えました。サーバーはリクエストごとにキーワード4つをランダムに選び、AIにコンテキストとして一緒に伝えます。
そのおかげで、同じカードと方向、バケットでもキーワードによって異なるリーディングが出ることがあります。

```mermaid
flowchart LR
    subgraph RandomSelect["ランダム選択"]
        Card[78枚カード]
        Dir[正位置/逆位置]
        Bucket[バケット 1~10]
        Keywords[キーワード 4つ]
    end

    subgraph CacheKey["キャッシュキー"]
        Key["tarot:read:{card}:{dir}:{bucket}"]
    end

    Card --> Key
    Dir --> Key
    Bucket --> Key

    Key --> Valkey[(Valkey)]
    Key -.->|キャッシュミス| OpenAI[OpenAI API]
    Keywords -.->|リーディング方向| OpenAI

````

全体の流れをシーケンスダイアグラムで示すと次のようになります。

```mermaid
sequenceDiagram
    autonumber

    actor Client as クライアント
    participant Service as TarotService
    participant Cache as Valkey
    participant AI as OpenAI

    Client->>Service: タロットリーディングリクエスト
    Note over Service: カード / 方向 / バケット ランダム選択

    Service->>Cache: キャッシュ照会 (`GET`)

    alt キャッシュヒット (Hit)
        Cache-->>Service: 保存された結果を返す
    else キャッシュミス (Miss)
        Service->>AI: OpenAI API呼び出し
        AI-->>Service: リーディング結果を返す ({advice})
        Note over Service: データ結合<br/>(card.name / card.nameKR / keywords)
        Service->>Cache: 結果保存 (`SET`)
    end

    Service-->>Client: 最終リーディング結果応答

```

---

## デプロイ

フロントエンドはVercelで、バックエンドはホームKubernetesクラスターで運用します。

```mermaid
flowchart TD
    subgraph Front["Vercel"]
        Vercel[タロットカード Next.js アプリ]
    end

    subgraph CICD["CI / CD"]
        GH[GitHub]
        Actions[GitHub Actions]
        Harbor[(Harbor)]
        ArgoCD[ArgoCD]
        S3[(S3)]
    end

    subgraph K8s["ホームK8sクラスター"]
        GW[Gateway API]
        Service[タロットカードサービス]
        HPA[HPA: 2~10 レプリカ]
    end

    %% デプロイパイプラインの流れ
    GH -->|Gitバージョンタグプッシュ v*.*.*| Actions
    Actions -->|イメージビルド/プッシュ| Harbor
    Harbor -->|イメージ保存| S3
    Harbor -->|イメージ参照| ArgoCD
    ArgoCD -->|GitOpsデプロイ| Service

    %% フロントエンドパイプラインの流れ
    Actions -->|フロントエンドビルド/デプロイ| Vercel

    %% トラフィックの流れ
    Vercel --> |外部トラフィック| GW
    GW -->|ルーティング| Service
    Service -->|自動拡張| HPA

```

デプロイパイプラインはGitHubに**新しいバージョンタグ(`v*.*.*`)がプッシュされると即座に**自動で開始されます。
GitHub Actionsがそのタグを基にイメージをビルドし、インハウスコンテナレジストリであるHarborにプッシュすると、
ArgoCDがGitOps設定を通じて変更を検知し、クラスターの状態を自動で同期します。
また、フロントエンドはGitHub ActionsからVercelに直接ビルドおよびデプロイが行われます。

バックエンドはHPAを通じてトラフィックに応じて2～10個のレプリカで自動拡張され、
外部からのユーザーのリクエストは内部Gateway APIで安全にルーティングされます。

---

## 改善の余地

現在はログインなしで誰でも利用できる簡単なサービスですが、
ログイン機能を追加してユーザーごとのリーディング履歴保存や個別化された体験を提供することも構想中です。

---

## 結びに

タロットカードサービスは小さなプロジェクトですが、AI生成とキャッシングのバランスという実質的な問題を解決していく過程が含まれています。
バケットシステムを活用したキャッシング戦略は、コストと多様性の間で現実的な妥協点を提供し、今後の改善の余地も十分に残されています。

```

```
