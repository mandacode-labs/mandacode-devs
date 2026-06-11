---
pubDate: 2026-06-03T00:00:00.000Z
tags:
  - Proxmox
  - Home Lab
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png'
title: >-
  Setting Up a Home Cluster Part 1: Choosing Hardware and Configuring the
  Network
description: >-
  Hardware Selection and Network Configuration in Building a Home Cluster Based
  on Proxmox VE
---
I wanted to handle various project operations, development and testing workloads, as well as personal learning and experimentation, all on AWS EKS.

But... the cloud is expensive.~~(Very much so.)~~

Since the cluster is primarily for personal services and development, I concluded that EKS was overkill.

So, I decided to build a home cluster (but) setting up a home server is not easy either.<br>
It would be nice to purchase professional hardware and install it on a rack mount, but that's not feasible in a household setting.
There are constraints such as cost, noise, heat, and space.

To choose the optimal solution, I set the following criteria:

- **Cost**: It shouldn't be too expensive
- **Noise**: It should be quiet enough to be barely noticeable
- **Heat**: It should be manageable in a typical household
- **Space**: It should fit in a small space
- **Performance**: It should handle the workloads I run on EKS

Cost constraints were particularly significant. The goal was to build a server with minimal investment given the current situation.

So, I purchased an Intel Xeon E5 series, a Chinese motherboard, and ECC memory cheaply from AliExpress,
and opted to use a regular desktop case due to noise and heat issues instead of a server case.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
(Thus, the prepared computers)
</center>

Although a total of three computers were prepared, due to power supply, network configuration, and noise, I decided it was best to configure with just one at this time.

Additionally, I wanted to set up the cluster with Talos Linux, and since there are plans for future cluster expansion and migration, I chose to run Talos Linux on a hypervisor rather than installing it directly.

I chose Proxmox VE as the hypervisor because it is free to use, easy to install, and supports various storage options like ZFS and Ceph, as well as network virtualization features.
Another major advantage is its intuitive dashboard UI, which makes management convenient.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)

<center style="font-size: 0.9em; color: #666;">
(Proxmox VE Dashboard)
</center>

In the future, I plan to expand the cluster using Proxmox VE's cluster features, but for now, since a single node is not entirely stable, I intend to manage the cluster state using ETCD backups and a GitOps workflow.

In the next article, I will discuss the process of installing Talos Linux on Proxmox VE and setting up a Kubernetes cluster!
