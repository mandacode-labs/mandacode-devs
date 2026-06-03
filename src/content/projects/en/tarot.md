---
url: 'https://tarot.mandacode.com'
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
teamSize: 2
order: 3
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png'
blogUrl: /ko/blog/tarot-deep-dive
title: Tarot Card
description: AI-based Tarot Card Reading Service
duration: March 2025 - April 2025
role: 'Frontend, Backend Development'
---
The Tarot Card service is an AI-based platform utilizing OpenAI's language model to provide users with tarot card reading results. It randomly selects cards from a deck of 78, determining orientation (upright or reversed) and one of several buckets to generate a reading with a new context each time. By employing a caching system, it efficiently reuses previously generated results to optimize API call costs and response times. In the event of a cache server failure, it gracefully falls back to directly calling OpenAI.

The backend, built on NestJS, ensures consistent responses with a structured output format and supports flexible environment configuration through a YAML and environment variable-based settings system. It operates across multiple instances using Docker and Kubernetes Helm Chart, with automatic scaling to handle varying loads.
