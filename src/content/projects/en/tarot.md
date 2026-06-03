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
Tarot Cards is an AI-based service that provides users with tarot card reading results utilizing OpenAI's language model. It selects cards randomly from a deck of 78, determining orientation (upright or reversed) and one of several buckets to generate a new contextual reading each time. Through a caching system, it quickly reuses previously generated results to optimize API call costs and response speed. In the event of a cache server failure, it gracefully handles the situation by directly calling OpenAI.

The backend, based on NestJS, ensures consistent responses with a structured output format and supports flexible environment configurations through a YAML and environment variable-based configuration system. It operates with multiple instances via Docker and Kubernetes Helm Chart, automatically scaling according to load.
