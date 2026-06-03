---
title: Tarot cards
description: AI-powered tarot card reading service
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
order: 3
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png'
blogUrl: /ko/blog/tarot-deep-dive
---

Tarot Cards is an AI-powered service that utilizes OpenAI's language model to provide users with tarot card readings.
It randomly selects cards from a 78-card deck, determines whether they are forward or reverse, and falls into one of several buckets to generate a new contextualized reading each time.
A caching system allows for quick reuse of previously generated results to optimize API call cost and response speed, while responding gracefully to cache server failures by calling OpenAI directly.

The NestJS-based backend ensures consistent responses with a structured output format,
A configuration system based on YAML and environment variables for flexible environment configuration.
It operates in multiple instances via Docker and Kubernetes Helm Chart and automatically scales with load.
