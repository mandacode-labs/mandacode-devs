---
title: 타로카드
description: "AI 기반 타로 카드 리딩 서비스"
url: "https://tarot.mandacode.com"
status: production
techStack:
  - TypeScript
  - NestJS
  - React
  - Next.js
  - OpenAI API
  - Valkey
  - Zod
  - Docker
  - Kubernetes
  - Helm
duration: "2025.03 - 2025.04"
teamSize: 2
role: "프론트엔드, 백엔드 개발"
order: 3
lang: ko
coverImage: "https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png"
blogUrl: "/ko/blog/tarot-deep-dive"
---

타로카드는 OpenAI의 언어 모델을 활용하여 사용자에게 타로 카드 리딩 결과를 제공하는 AI 기반 서비스입니다.
78장의 카드 덱에서 무작위로 카드를 선택하고, 정방향 또는 역방향, 여러 버킷 중 하나를 결정하여 매번 새로운 맥락의 리딩을 생성합니다.
캐싱 시스템을 통해 이전에 생성된 결과를 빠르게 재사용하여 API 호출 비용과 응답 속도를 최적화하면서도, 
키워드 기반의 맥락 전달로 같은 카드와 방향, 버킷 조합에서도 다양한 리딩이 나올 수 있도록 설계되었습니다.
