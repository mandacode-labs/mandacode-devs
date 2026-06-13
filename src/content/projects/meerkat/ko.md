---
title: Meerkat
description: AI Agent 기반 로그 분석 및 모니터링 시스템
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

Meerkat은 AI Agent가 직접 인프라의 로그와 메트릭을 분석하여 이상 징후를 탐지하는 관측 가능성 플랫폼입니다.
기존 규칙 기반 알림의 한계를 넘어, 자연어 질의나 외부 웹훅을 통해 전달된 이벤트를 AI가 스스로 맥락을 파악하고
Prometheus, Loki 등의 도구를 직접 쿼리하며 원인을 추론합니다.
OpenTelemetry로 로그를 수집된 로그를 벡터 데이터베이스에 저장하여 의미 기반 검색을 지원하며,
분석 결과는 웹훅으로 외부 채널에 전달됩니다.

시스템은 Analyzer와 Vectors 두 개의 독립적인 서비스로 구성되어 있으며, Kubernetes 환경에서 Helm Chart로 배포됩니다.
Analyzer는 비동기 워커 풀과 중복 분석 방지, 컨텍스트 오버플로우 복구 메커니즘 등을 통해 대규모 로그 처리에도 안정적으로 동작하도록 설계되었습니다.
Vectors는 템플릿 추출을 통해 로그의 중복을 제거하고, OpenAI 임베딩을 거쳐 Milvus에 저장하여 효율적인 의미 검색이 가능하도록 구현되었습니다.
