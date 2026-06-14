---
title: 塔罗牌
description: 基于AI的塔罗牌解读服务
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
role: "前端, 后端开发"
order: 3
coverImage: "https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png"
blogUrl: /ko/blog/tarot-deep-dive
---

塔罗牌是一个基于AI的服务，利用OpenAI的语言模型为用户提供塔罗牌解读结果。它从78张卡牌的牌组中随机选择卡牌，并确定正位或逆位，以及多个桶中的一个，从而每次生成新的上下文解读。通过缓存系统快速重用先前生成的结果，以优化API调用成本和响应速度，同时通过基于关键词的上下文传递，即使在相同的卡牌和方向、桶组合中，也能产生多样化的解读。
