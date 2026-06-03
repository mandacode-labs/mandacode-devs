---
title: 'Building a Home Cluster Part 1: Selecting Hardware and Configuring the Network'
description: >-
  Selecting hardware and configuring the network in the process of building a
  home cluster based on Proxmox VE
pubDate: '2026-06-03T00:00:00.000Z'
tags:
  - Proxmox
  - Home Lab
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png'
---
I aimed to handle various project operations, development, and test workloads, as well as personal learning and experimentation, all on AWS EKS.

However... the cloud is expensive.~~(Very much so.)~~

Since the cluster was primarily for personal services and development, I concluded that EKS was overkill.

Thus, I decided to build a home cluster. (But) setting up a home server isn't easy.<br>
While it would be ideal to purchase professional hardware and run it on a rack mount, that's not feasible in a home environment.
There are constraints such as cost, noise, heat, and space.

To choose the optimal solution, I set the following criteria:

- **Cost**: It shouldn't be too expensive
- **Noise**: It should be quiet enough to be barely noticeable
- **Heat**: It should be manageable in a typical home
- **Space**: It should fit in a small space
- **Performance**: It should handle workloads currently running on EKS

Cost was the biggest constraint. The goal was to build the server with minimal investment given the current situation.

So, I purchased Intel Xeon E5 series and Chinese motherboards, along with ECC memory from AliExpress at a low cost.
For the server case, due to noise and heat issues, I decided to use a regular desktop case.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
(Thus, the prepared computers)
</center>

Although a total of three computers were prepared, due to power supply, network configuration, and noise, it was deemed best to configure with just one at this point.

Additionally, I intended to configure the cluster with Talos Linux, and since there are plans for future cluster expansion and migration, I chose to run Talos Linux on a hypervisor instead of installing it directly.

I chose Proxmox VE as the hypervisor because it is free to use, easy to install, and supports various storage options like ZFS and Ceph, as well as network virtualization features.
Another major advantage is its intuitive dashboard UI, which makes management convenient.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)
<center style="font-size: 0.9em; color: #666;">
(Proxmox VE Dashboard)
</center>

While I plan to utilize Proxmox VE's clustering features to expand the cluster in the future, for now, since a single node isn't completely stable, I plan to manage the cluster state using ETCD backups and a GitOps workflow.

In the next post, I will discuss the process of installing Talos Linux on Proxmox VE and configuring a Kubernetes cluster!
