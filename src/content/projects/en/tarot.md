---
title: Tarot Cards
description: AI-based Tarot Card Reading Service
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
duration: 2025.03 - 2025.04
teamSize: 2
role: 'Frontend, Backend Development'
order: 3
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png'
blogUrl: /ko/blog/tarot-deep-dive
---
Tarot Cards is an AI-based service that provides tarot card reading results to users by leveraging OpenAI's language model. It randomly selects cards from a deck of 78, determining upright or reversed positions, and chooses from several buckets to generate a reading with a new context each time. Through a caching system, it quickly reuses previously generated results to optimize API call costs and response times. In the event of a cache server failure, it gracefully handles the situation by directly calling OpenAI.

The backend, built on NestJS, ensures consistent responses with a structured output format and supports flexible environment configurations through a YAML and environment variable-based settings system. It operates across multiple instances using Docker and Kubernetes Helm Chart, automatically scaling according to load.
