---
title: 미어캣
description: AI 에이전트 기반 로그 분석 및 모니터링 시스템
sourceUrl: "https://github.com/serengeti-sh/meerkat"
status: production
techStack:
  - Go
  - gRPC
  - OpenTelemetry
  - OpenAI API
  - RAG
  - PostgreSQL
  - Milvus
  - Kubernetes
  - Helm
  - Ent ORM
duration: 2026.04 - 2026.06
teamSize: 1
role: 풀스택 개발
order: 2
coverImage: "https://static.mandacode.com/mandacode-devs/projects/meerkat/cover.png"
blogUrl: /ko/blog/meerkat-deep-dive
---

미어캣은 로그를 벡터화하여 저장하고 AI 에이전트가 저장된 데이터와 실시간으로 수집되는 로그를 모두 활용하여 이상 징후를 탐지하는 관측 가능성 플랫폼입니다. 기존의 규칙 기반 알림 시스템과 달리, LLM을 활용하여 에이전트가 자연어 질의나 외부 이벤트를 통해 전달된 정보를 바탕으로 로그와 메트릭을 직접 분석하여 이상 징후를 탐지합니다. OpenTelemetry과 같은 데이터 수집 도구와 결합하여 사용하도록 설계되었으며, 분석 결과는 웹훅을 통해 Slack과 같은 외부 채널로 전달됩니다.
