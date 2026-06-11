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
role: 'Frontend, Backend Development'
---
Tarot Cards is an AI-based service that utilizes OpenAI's language model to provide users with tarot card reading results. It randomly selects cards from a deck of 78, determines whether they are upright or reversed, and chooses one of several buckets to generate a reading with a new context each time. Through a caching system, previously generated results can be quickly reused, optimizing API call costs and response times. It is designed to deliver diverse readings even with the same card, orientation, and bucket combination by conveying context based on keywords.
