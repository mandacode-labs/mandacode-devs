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
order: 3
lang: ko
coverImage: "/images/projects/tarot/cover.png"
blogUrl: "/ko/blog/tarot-deep-dive"
---

타로카드는 OpenAI의 언어 모델을 활용하여 사용자에게 타로 카드 리딩 결과를 제공하는 AI 기반 서비스입니다. 
78장의 카드 덱에서 무작위로 카드를 선택하고, 정방향 또는 역방향, 여러 버킷 중 하나를 결정하여 매번 새로운 맥락의 리딩을 생성합니다. 
캐싱 시스템을 통해 이전에 생성된 결과를 빠르게 재사용하여 API 호출 비용과 응답 속도를 최적화하면서도, 캐시 서버 장애 시에는 OpenAI를 직접 호출하여 우아하게 대응합니다.

NestJS 기반의 백엔드는 구조화된 출력 형식으로 일관된 응답을 보장하며, 
YAML과 환경 변수 기반의 설정 시스템으로 유연한 환경 구성을 지원합니다. 
Docker와 Kubernetes Helm Chart를 통해 여러 인스턴스로 운영되며 부하에 따라 자동 확장됩니다.
