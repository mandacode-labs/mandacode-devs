---
title: 'Meerkat: Designing and Implementing an AI Agent-Based Observability Platform'
description: >-
  In-depth technical analysis of the Meerkat project's architecture, log
  ingestion pipeline, AI Agent analysis loop, and operational strategy.
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Go
  - AI
  - Observability
  - OpenTelemetry
  - RAG
  - Kubernetes
lang: en
---

## enters

In modern distributed systems, logs and metrics have become massive, but interpreting them is still a human endeavor. Meerkat is an attempt to address this point with an AI agent. Rather than simply collecting and storing logs, we've built a system of agents that query, analyze, and draw conclusions directly from LLM. In this article, we'll cover the design philosophy and implementation details of two of Meerkat's core services, Analyzer and Vectors.

## Vectors: a semantic log store

Meerkat's Vectors service is not just a log aggregator, but a vector repository with semantic search. It receives logs from applications over the OpenTelemetry OTLP protocol, converts them into structured entries, and burns them through a pipeline.

The first step in the pipeline is filtering. It supports three modes: all, severity, and template. The default, template mode, is a simplified implementation of the Drain algorithm. It uses regular expressions to mask parameters such as integers, IPs, paths, and emails, and then merges them with templates that have a token-wise similarity of at least 0.7. It keeps up to 10,000 templates in memory and emits them in an LRU fashion, and does not vectorize duplicate logs, which significantly reduces the cost of embedding API calls.

Logs that pass the filtering are embedded with OpenAI's text-embedding-3-small model and stored in Milvus. The Milvus collection uses the HNSW index and enables metadata-driven search by applying service name and time range as expression filters. Vectors also exposes its own Prometheus metrics, which measure ingestion volume, deduplication rate, and search and embedding latency.

## Analyzer: AI agents that use the tool

The Analyzer service is an HTTP API server that puts incoming requests into an asynchronous worker pool for processing. It is configured with a buffered channel size of 1000, 10 workers, and provides a backpressure that immediately returns a 429 error when the queue is full. Report statuses are managed as queued, running, completed, and failed, and duplicate requests with the same trigger are blocked within a 5 minute window.

At the heart of the analysis is the LLM Agent Loop. Analyzer provides LLM with a list of available tools, and LLM writes its own PromQL or LogQL to query Prometheus or Loki, or asks Vectors for a natural language search. Tool results are limited to 30,000 characters, and errors are categorized as parameter_validation, connection, or query, prompting the LLM to retry or change strategy.

Of particular interest is the context overflow recovery mechanism. If the LLM returns a context length error, the Analyzer summarizes the previous conversation turns, compresses them into a single message, and retries, keeping only the last two exchanges. Additionally, Vectors' GetContext uses the zero-vector trick of embedding an empty string to retrieve recent logs by metadata filters alone, without semantic similarity.

## Communication and deployment between services

Analyzer and Vectors communicate with gRPC. Through the Search and GetContext methods defined by ProtoBuf, Analyzer requests semantic search from Vectors, while Vectors performs OTLP reception and vector storage independently. This separation allows Vectors to receive logs directly from OpenTelemetry Collector, and Analyzer to focus on AI analysis.

The database is only PostgreSQL, and the Ent ORM manages only Report entities. We intentionally kept the schema minimal to reduce operational complexity. Deployment is done with Helm Chart, storing settings and system prompts in ConfigMap, and API keys and DB passwords separately in Secret. The migration runs as a Kubernetes Job and can be integrated with the ArgoCD PreSync hook.

## What we didn't like and how to improve

Currently, queues are in-memory channel-based, so jobs in queued state are lost when Analyzer restarts. They remain queued in the DB, but there is no mechanism to reprocess them. Also, Vectors' OTLP and gRPC endpoints are not authenticated, which can be dangerous in low confidence interval networks. In the future, we plan to apply persistent queues and mTLS to increase transportation reliability.

## Closing thoughts.

Meerkat has gone beyond simply calling LLM APIs, combining a tool-enabled agent architecture with semantic log search and a controllable pool of asynchronous workers to create an observability platform that can be used in real production environments. The ultimate goal of the project is to provide natural language-based, intuitive insights to teams where rule-based alerting has reached its limits.
