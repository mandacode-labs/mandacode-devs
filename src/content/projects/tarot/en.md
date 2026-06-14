---
title: Tarot Cards
description: AI-based Tarot Card Reading Service
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
duration: 2025.03 - 2025.04
teamSize: 2
role: "Frontend, Backend Development"
order: 3
coverImage: "https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png"
blogUrl: /ko/blog/tarot-deep-dive
---

Tarot Cards is an AI-based service that uses OpenAI's language model to provide users with tarot card reading results. It randomly selects cards from a deck of 78, determines whether they are upright or reversed, and chooses one of several buckets to generate a reading with a new context each time. Through a caching system, previously generated results can be quickly reused to optimize API call costs and response speed. Additionally, by conveying context based on keywords, the service is designed to produce diverse readings even with the same card, orientation, and bucket combination.
