---
title: Blog test post with images
description: >-
  A test blog post with images. Verify that the coverImage and body image
  display correctly.
pubDate: 2026-05-29T00:00:00.000Z
tags:
  - test
  - image
  - markdown
draft: false
coverImage: /images/blog/test-blog-cover.webp
ogImage: /images/blog/test-blog-og.webp
lang: en
---

## Test the image

This is a test of a **blog post with images**. It verifies that various markdown elements and images are rendered correctly.

### Body image

Below is an image inserted into the body:

![body test image](/images/blog/test-body-image.webp)

### Various markdown elements

#### code block

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

#### quote

> "An image is worth a thousand words."
>
> - Proverb

#### List

**Ordered list:** \*\*See also

1. check the cover image
2. check body image
3. Check for OG images
4. check for responsive layout

**Non-ordered list:** 1.

- Astro Framework
- Tailwind CSS styling
- TypeScript type safety
- Deploying Cloudflare Pages

### Tables

| Feature      | Status | Remarks                |
| ------------ | ------ | ---------------------- |
| Cover images | ✅     | Cards and detail pages |
| OG Images    | ✅     | Social sharing         |
| Body Images  | ✅     | Markdown Syntax        |
| Responsive   | ✅     | Mobile/Desktop         |

### Conclusion

This test post should help you verify that your images and markdown are rendering correctly. If you have any issues, check your schema or components!

---]

\_This article was written for testing purposes only.
