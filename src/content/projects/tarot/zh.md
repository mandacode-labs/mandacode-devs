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
coverImage: "https://static.mandacode.com/mandacode-devs/projects/tarot/cover.png"
blogUrl: /ko/blog/tarot-deep-dive
title: 塔罗牌
description: AI驱动的塔罗牌解读服务
duration: 2025.03 - 2025.04
role: 前端，后端开发
---

타罗卡是一个基于AI的服务，利用OpenAI的语言模型为用户提供塔罗牌解读结果。  
从78张牌的牌组中随机选择一张牌，确定正位或逆位，以及多个桶中的一个，每次生成新的上下文解读。  
通过缓存系统快速重用之前生成的结果，以优化API调用成本和响应速度，同时通过基于关键词的上下文传递，即使是相同的牌和方向、桶组合，也能够产生多样的解读。
