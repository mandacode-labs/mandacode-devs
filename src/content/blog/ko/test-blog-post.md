---
title: "이미지 포함 블로그 테스트 글"
description: "이미지를 포함한 테스트용 블로그 글입니다. coverImage와 본문 이미지가 올바르게 표시되는지 확인합니다."
pubDate: 2026-05-29
tags: ["test", "image", "markdown"]
draft: false
coverImage: "/images/blog/test-blog-cover.webp"
ogImage: "/images/blog/test-blog-og.webp"
lang: ko
---

## 이미지 테스트

이 글은 **이미지가 포함된 블로그 포스트** 테스트입니다. 다양한 마크다운 요소와 이미지가 올바르게 렌더링되는지 확인합니다.

### 본문 이미지

아래는 본문에 삽입한 이미지입니다:

![본문 테스트 이미지](/images/blog/test-body-image.webp)

### 다양한 마크다운 요소

#### 코드 블록

```typescript
// TypeScript 예제
interface BlogPost {
  title: string;
  coverImage?: string;
  content: string;
}

const post: BlogPost = {
  title: "테스트 글",
  content: "이미지와 마크다운을 테스트합니다.",
};
```

#### 인용문

> "이미지는 천 개의 단어보다 가치가 있다."
> — 속담

#### 목록

**순서 있는 목록:**

1. 커버 이미지 확인
2. 본문 이미지 확인
3. OG 이미지 확인
4. 반응형 레이아웃 확인

**순서 없는 목록:**

- Astro 프레임워크
- Tailwind CSS 스타일링
- TypeScript 타입 안전성
- Cloudflare Pages 배포

### 표

| 기능        | 상태 | 비고               |
| ----------- | ---- | ------------------ |
| 커버 이미지 | ✅   | 카드와 상세 페이지 |
| OG 이미지   | ✅   | SNS 공유           |
| 본문 이미지 | ✅   | 마크다운 문법      |
| 반응형      | ✅   | 모바일/데스크톱    |

### 결론

이 테스트 글을 통해 이미지와 마크다운이 올바르게 렌더링되는지 확인할 수 있습니다. 문제가 있다면 스키마나 컴포넌트를 점검핳세요!

---

_이 글은 테스트 목적으로 작성되었습니다._
