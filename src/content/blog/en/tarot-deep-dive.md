---
title: 'Tarot Core: AI tarot service built with caching and Structured Outputs'
description: >-
  Technical analysis of the Tarot Core API's random bucket caching strategy,
  utilization of OpenAI Structured Outputs, NestJS module design, and
  operational automation.
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - TypeScript
  - NestJS
  - OpenAI
  - Redis
  - Kubernetes
  - Caching
lang: en
---

## enters

AI-generated content is new every time, but it's inefficient to call the API every time for the same input. Tarot Core is an attempt to find a balance between caching and AI generation in the creative domain of tarot card reading. It leverages OpenAI GPT-4o-mini, but optimizes for response speed and cost with Valkey cache. This article covers its design strategy and implementation details.

## Bucket-based caching strategy

Tarot readings are fun when you get a different interpretation every time, even for the same cards and directions. But at the same time, calling the OpenAI API every time incurs costs and slows down the response. To solve this dilemma, we introduced a bucket system.

78 cards x 2 directions x 10 buckets = up to 1,560 unique combinations. Each time a user makes a request, the card, direction, and bucket number are randomly selected, and these three values generate the cache key tarot:read:{card}:{direction}:{bucket}. Subsequent requests for the same key are returned immediately by Valkey, only calling the OpenAI API on cache misses. The default TTL is set to 1 hour, so requests for the same combination within an hour will reuse the cached results.

Keywords are randomly selected from a total of 60 candidates in four categories: emotion, behavior, time, and theme. These keywords are included in user messages to guide the AI to generate leads around specific topics. The cache does not contain keywords, so if a different keyword is selected, even from the same bucket, a new lead is generated.

## Engineering prompts with OpenAI Structured Outputs

The OpenAI integration uses the Structured Outputs API rather than simple text generation. When you pass a Zod schema with zodResponseFormat(), the OpenAI API enforces a JSON format, eliminating client-side parsing errors. The response schema consists of title (English card name), titleKR (Korean card name), keywords (an array of four keywords), and advice (advice message).

We specified that the system prompts should be written in a cold, natural tone, like a fortune teller, and avoid using special characters and direct user information. The card names are read in English, but the directions are expressed in forward/backward, and you are instructed to speak as naturally as a real fortune teller would speak. The user message is passed in JSON with the card information and selected keywords to help the AI understand the context.

All cache calls are wrapped in try/catch in case the cache server runs out: get() failures are treated as cache misses by returning null, and set() failures are silently ignored. This ensures that even in the event of a Valkey failure, the service responds gracefully with a direct call to OpenAI.

## NestJS module structure and configuration system

The application is organized by NestJS's module system. The ValkeyModule is registered as a @Global() decorator and can be injected from anywhere, while the OpenAIModule is explicitly imported from the TarotModule. TarotService is responsible for all the business logic and there is no separate repository tier - the data is all hardcoded in-memory decks of cards and keyword pools, so no DB is required.

Settings are managed in two layers: YAML files and environment variables. The default settings are loaded into the js-yaml and overridden by six environment variables, such as OPENAI_API_KEY or VALKEY_PASSWORD. It handles defaults and validation simultaneously via a Zod schema, and consists of four sections: server, openai, tarot, and cache. It is injected and used globally via the NestJS ConfigModule.

## Deployment and Operations

Dockerfile uses a three-stage multi-stage build: install and build dependencies in the builder stage, remove devDependencies in the pruner stage, and run as a non-root user in the runtime stage. Helm Chart runs with 2 replicas by default and automatically scales from 2 to 10 via HPA. Optionally, you can deploy a lower-spec Valkey instance with it, allowing you to configure the entire stack with a single command, even in a development environment.

In the security context, we applied runAsNonRoot, runAsUser: 1001, seccompProfile: RuntimeDefault, and dropped all capabilities. We set minAvailable: 1 as the Pod Disruption Budget to ensure service availability even during rolling updates. The probes all use the /health endpoint, and we set different cycles for liveness and readiness to achieve both fast recovery in case of failure and reliable readiness at startup.

## Limitations and improvements to caching strategies

Currently, cache keys do not include keywords, which can cause cache hits to return different reads than intended if they differ only in keywords for the same bucket. This is by design: within a bucket, keywords do not affect the cache key, saving cache space. However, the lack of cache warming means that all entries are only generated on the first request, which can lead to heavy OpenAI calls during cold starts. In the future, we are considering prewarming popular combinations.

## Closing

Tarot Core is an interesting project that demonstrates a balance of caching and AI generation, a reliable response format using Structured Outputs, and a modern deployment pipeline utilizing NestJS and Kubernetes. It's not just a toy, it's designed for both cost and performance in real-world production environments.
