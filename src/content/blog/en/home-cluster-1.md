---
pubDate: 2026-06-03T00:00:00.000Z
tags:
  - Proxmox
  - Home Lab
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png'
title: 'Building a Home Cluster Part 1: Selecting Hardware and Configuring the Network'
description: >-
  Hardware Selection and Network Configuration in Building a Home Cluster Based
  on Proxmox VE
---
To handle various project operations, development and testing workloads, as well as personal learning and experimentation, I aimed to manage everything on AWS EKS.

However... the cloud is expensive.~~(Very much so.)~~

Since the cluster was primarily for personal services and development, I concluded that EKS was overkill.

Thus, I decided to build a home cluster. However, setting up a home server is no easy task.<br>
While it would be ideal to purchase professional hardware and run it on a rack mount, that's not feasible in a household setting.
There are several constraints such as cost, noise, heat, and space.

To choose the optimal solution, I established the following criteria:

- **Cost**: It should not be too expensive.
- **Noise**: It should be quiet enough to be almost inaudible.
- **Heat**: It should be manageable in a typical home environment.
- **Space**: It should fit in a small space.
- **Performance**: It should handle workloads that run on EKS.

Cost was the most significant constraint. The goal was to build the server with minimal investment given the current circumstances.

Therefore, I purchased Intel Xeon E5 series processors, a Chinese motherboard, and ECC memory at a low cost from AliExpress.
Due to noise and heat issues, I decided to use a standard desktop case instead of a server case.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
(Thus, the prepared computers)
</center>

Although three computers were prepared, due to power supply, network configuration, and noise issues, it was deemed best to configure with just one at this point.

Additionally, I planned to configure the cluster with Talos Linux. Since there are plans for future cluster expansion and migration, I chose to run Talos Linux on a hypervisor rather than installing it directly.

I selected Proxmox VE as the hypervisor because it is free to use, easy to install, and supports various storage options like ZFS, Ceph, and network virtualization features. Another major advantage is its intuitive dashboard UI, which makes management convenient.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)
<center style="font-size: 0.9em; color: #666;">
(Proxmox VE Dashboard)
</center>

While I plan to expand the cluster using Proxmox VE's clustering features in the future, for now, since a single node isn't completely stable, I intend to manage the cluster state using ETCD backups and a GitOps workflow.

In the next post, I will discuss the process of installing Talos Linux on Proxmox VE and setting up a Kubernetes cluster!
