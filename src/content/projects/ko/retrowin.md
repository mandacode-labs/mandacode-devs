---
title: Retrowin
description: "외부 스토리지 연동 파일 관리 및 저장 서비스"
url: "https://retrowin.mandacode.com"
sourceUrl: "https://github.com/mandacode-labs/retrowin-go"
status: production
techStack:
  - Go
  - Kubernetes
  - AWS S3
  - React
  - Next.js
  - Keycloak
  - PostgreSQL
  - Valkey
  - ogen
  - Ent ORM
  - Helm
order: 1
lang: ko
coverImage: "https://static.mandacode.com/mandacode-devs/projects/retrowin/cover.png"
blogUrl: "/ko/blog/retrowin-deep-dive"
---

Retrowin은 외부 오브젝트 스토리지와 연동하여 POSIX 스타일의 파일 관리 인터페이스를 제공하는 분산 파일 관리 시스템입니다. 
사용자는 익숙한 디렉토리 구조와 권한 체계로 파일을 다루면서, 실제 데이터는 S3나 MinIO에 안전하게 저장됩니다. 
Presigned URL 기반의 2단계 업로드와 원자적 트랜잭션으로 데이터 정합성을 보장하며, Keycloak OIDC 인증과 Unix 스타일 권한 관리로 보안을 확보했습니다.

Garbage Collection 기능으로 사용되지 않는 파일을 자동 정리하여 스토리지 비용을 절감하고, 
Windows XP 스타일의 레트로 UI를 통해 복고적인 감성과 현대적인 사용자 경험을 동시에 제공합니다. 
Kubernetes와 Helm Chart를 활용한 배포로 높은 확장성과 안정성을 확보합니다.
