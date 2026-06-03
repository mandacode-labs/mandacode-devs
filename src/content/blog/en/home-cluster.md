---
title: 'Building a home cluster1: Selecting hardware and configuring your network'
description: >-
  Hardware selection and network configuration in building a home cluster based
  on Proxmox VE
pubDate: 2026-06-03T00:00:00.000Z
tags:
  - Proxmox
  - Home Lab
lang: en
---

We wanted to run a variety of projects, handle development and testing workloads, and do it all on AWS EKS for personal learning and experimentation.

But... The cloud is expensive (a lot).

We decided that EKS was overkill for a cluster that was primarily for personal services and development anyway.

So I decided to build a home cluster (but building a home server isn't easy either).<br>
It would be nice to be able to buy specialized hardware, install it on a rackmount, and run it, but that's just not possible at home.
There are many constraints: price, noise, heat, space, etc.

Here's a look at the factors you need to understand to choose the best solution.

- Price: shouldn't be too expensive
- Noise: It should be quiet enough to be almost inaudible
- Heat output: should be manageable for the average household
- Space: It should be able to be installed in small spaces
- Performance: It should be able to handle the workloads that the EKS is running

Price was the biggest constraint - the goal was to build the server for the least amount of money possible at this point.

So I decided to build a home cluster by purchasing a cheap Intel Xeon E5 series, a Chinese motherboard, and some ECC memory from Ali.

I decided to build a cluster of three servers (one of which I decided to utilize an existing mini-PC), as I thought it would be too risky to build a single server.
I also decided to use a regular desktop case for the servers due to noise and heat issues.

![Home cluster diagram](https://static.mandacode.com/mandacode-devs/blog/home-cluster/hardware.jpg)

<center style="font-size: 0.9em; color: #666;"> <center style="font-size: 0.9em; color: #666;">
(And the computers are ready to go)
</center>.
