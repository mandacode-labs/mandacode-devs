---
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
teamSize: 2
order: 3
lang: en
coverImage: "https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png"
blogUrl: /ko/blog/tarot-deep-dive
title: Tarot Cards
description: AI-based Tarot Card Reading Service
duration: March 2025 - April 2025
role: "Frontend, Backend Development"
---

Tarot Cards is an AI-based service that utilizes OpenAI's language model to provide users with tarot card reading results. It randomly selects cards from a deck of 78, determines whether they are upright or reversed, and chooses from several buckets to create a new contextual reading each time. Through a caching system, it quickly reuses previously generated results to optimize API call costs and response times. In case of cache server failures, it gracefully handles the situation by directly calling OpenAI.

The backend, based on NestJS, ensures consistent responses with a structured output format and supports flexible environment configuration through a YAML and environment variable-based settings system. It operates with multiple instances via Docker and Kubernetes Helm Chart and automatically scales according to the load.
