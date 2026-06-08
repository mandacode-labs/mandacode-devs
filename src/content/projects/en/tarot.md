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
title: Tarot card
description: AI-based Tarot Card Reading Service
duration: March 2025 - April 2025
role: 'Frontend, backend development'
---
Tarot Card is an AI-based service that utilizes OpenAI's language model to provide users with tarot card reading results. It selects cards randomly from a deck of 78 cards, determining whether they are upright or reversed, and assigns them to one of several buckets to create a reading with a new context each time. Through a caching system, it quickly reuses previously generated results to optimize API call costs and response times. In the event of a cache server failure, it gracefully handles the situation by directly calling OpenAI.

The backend, based on NestJS, ensures consistent responses with a structured output format and supports flexible environment configuration through a YAML and environment variable-based settings system.
