---
title: 한국어 자동차 번호판 검출기
description: "YOLO 기반 한국어 자동차 번호판 검출 및 인식 시스템"
sourceUrl: "https://github.com/sauce-git/korean-license-plate-detector"
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
  - OpenPyXL
duration: "2023.09 - 2023.12"
teamSize: 1
role: "풀스택 개발"
order: 3
lang: ko
blogUrl: "/ko/blog/korean-license-plate-deep-dive"
coverImage: "https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png"
---

한국어 자동차 번호판 검출기는 ONNX Runtime 기반의 실시간 이미지 처리 파이프라인으로,
객체 탐지 모델을 활용해 번호판을 찾고 개별 문자를 인식합니다.
기존 문자 인식 방식이 아닌 각 문자를 독립적인 객체로 탐지하는 접근법을 사용하여 흐릿한 이미지나 기울어진 각도,
부분적인 가림 등 어려운 환경에서도 높은 인식률을 달성합니다.
세 개의 전문화된 모델을 순차적으로 적용하여 번호판 영역을 검출하고, 원근 보정을 수행하며, 최종적으로 문자를 인식하는 3단계 파이프라인으로 구성되어 있습니다.

PySide6 기반의 GUI를 통해 디렉토리 단위 배치 처리를 지원하며,
검출 실패 시 사용자가 직접 입력할 수 있도록 유연한 인터페이스를 제공합니다.
처리 결과는 엑셀 파일로 자동 저장되며, PyInstaller를 활용한 단일 실행 파일 배포로 실제 현장에서 즉시 사용 가능합니다.
