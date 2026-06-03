---
title: 'Building a Home Cluster 1: Choosing Hardware and Configuring the Network'
description: >-
  Selecting hardware and configuring the network for a home cluster based on
  Proxmox VE
pubDate: 2026-06-03
tags:
  - Proxmox
  - Home Lab
lang: en
coverImage: 'https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png'
---
I initially aimed to handle various project operations, development, and test workloads, as well as personal learning and experimentation, all on AWS EKS.

However... the cloud is expensive.~~(Very much so.)~~

Considering that the cluster was primarily for personal services and development, I concluded that EKS was overkill.

Thus, I decided to build a home cluster. However, setting up a home server is no easy task.<br>
While it would be ideal to purchase professional hardware and install it in a rack mount, that's not feasible in a household setting.
There are constraints such as cost, noise, heat, and space.

To choose the optimal solution, I established the following criteria:

- **Cost**: It should not be too expensive
- **Noise**: It should be quiet enough to be barely noticeable
- **Heat**: It should be manageable in a typical home environment
- **Space**: It should fit in a small space
- **Performance**: It should handle workloads currently running on EKS

Cost was the most significant constraint. The goal was to build the server with minimal investment given the current situation.

Therefore, I purchased Intel Xeon E5 series and Chinese motherboards, along with ECC memory, at a low cost from AliExpress.
For the server case, due to noise and heat issues, I decided to use a standard desktop case.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
(Thus, the computers were prepared)
</center>

Although three computers were prepared, due to power supply, network configuration, and noise, it was deemed best to configure with just one at this point.

Additionally, I planned to configure the cluster with Talos Linux, and since there are future plans for cluster expansion and migration, I chose to run Talos Linux on a hypervisor rather than installing it directly.

I selected Proxmox VE as the hypervisor because it is free to use, easy to install, and supports various storage options like ZFS and Ceph, as well as network virtualization features.
Moreover, its intuitive dashboard UI makes management convenient, which was a significant advantage.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)
<center style="font-size: 0.9em; color: #666;">
(Proxmox VE Dashboard)
</center>

While I plan to expand the cluster using Proxmox VE's clustering features in the future, for now, since a single node is not entirely stable, I intend to manage the cluster state through ETCD backups and a GitOps workflow.

In the next article, I will discuss the process of installing Talos Linux on Proxmox VE and configuring a Kubernetes cluster!
