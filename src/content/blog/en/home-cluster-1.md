---
title: 'Building a Home Cluster Part 1: Hardware Selection and Network Configuration'
description: >-
  Hardware selection and network configuration in the process of building a home
  cluster based on Proxmox VE
pubDate: '2026-06-03T00:00:00.000Z'
tags:
  - Proxmox
  - Home Lab
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png'
---
I initially planned to handle all my diverse project operations, development, testing workloads, and personal learning and experimentation on AWS EKS.

However... the cloud is expensive.~~(Very much so.)~~

Since the cluster is primarily for personal services and development, I concluded that EKS was overkill.

Thus, I decided to build a home cluster. However, setting up a home server is not an easy task.<br>
While it would be ideal to purchase professional hardware and install it on a rack mount, that's not feasible in a household setting.
There are several constraints such as cost, noise, heat, and space.

To choose the optimal solution, I established the following criteria:

- **Cost**: It should not be too expensive
- **Noise**: It should be quiet enough to be barely noticeable
- **Heat**: It should be manageable in a typical household
- **Space**: It should be installable in a small area
- **Performance**: It should be capable of handling workloads run on EKS

The cost constraint was particularly significant. The goal was to build the server with minimal investment given the current situation.

Therefore, I purchased Intel Xeon E5 series and Chinese motherboards, along with ECC memory, at a low price from AliExpress.
For the server case, I opted for a standard desktop case due to noise and heat issues.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
(Thus, the prepared computers)
</center>

Although a total of three computers were prepared, due to power supply, network configuration, and noise, it was deemed best to configure with just one at this point.

Additionally, I planned to configure the cluster with Talos Linux, and since there are plans for future cluster expansion and migration, I chose to run Talos Linux on a hypervisor rather than installing it directly.

I selected Proxmox VE as the hypervisor because it is free to use, easy to install, and supports various storage options like ZFS and Ceph, as well as network virtualization features. Another major advantage is its intuitive dashboard UI, which makes management convenient.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)
<center style="font-size: 0.9em; color: #666;">
(Proxmox VE Dashboard)
</center>

Although I plan to expand the cluster using Proxmox VE's clustering features in the future, for now, since a single node is not entirely stable, I intend to manage the cluster state through ETCD backup and GitOps workflow.

In the next article, I will discuss the process of installing Talos Linux on Proxmox VE and configuring a Kubernetes cluster!
