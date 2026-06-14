---
title: "Building a Home Cluster 1: Hardware Selection and Network Configuration"
description: Hardware selection and network configuration in the process of building a home cluster based on Proxmox VE
pubDate: 2026-06-03T00:00:00.000Z
tags:
  - Proxmox
  - Home Lab
coverImage: "https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png"
---

I wanted to handle various project operations, development and testing workloads, and personal learning and experimentation all on AWS EKS.

But... the cloud is expensive. ~~(Very much so.)~~

Since the cluster is mainly for personal services and development, EKS seemed too excessive.

So, I decided to build a home cluster, but setting up a home server is no easy task either.  
It would be great to buy professional hardware and install it in a rack mount, but that's not feasible in a home environment.  
There are constraints like cost, noise, heat, and space.

To choose the optimal solution, I set the following criteria:

- **Cost**: It shouldn't be too expensive.
- **Noise**: It should be quiet enough to be barely noticeable.
- **Heat**: It should be manageable in a typical household.
- **Space**: It should be installable in a small space.
- **Performance**: It should be capable of handling workloads that run on EKS.

The cost constraint was particularly significant. The goal was to build the server with minimal expense given the current situation.

So, I purchased Intel Xeon E5 series and Chinese motherboards cheaply from AliExpress, along with ECC memory.  
For the server case, due to noise and heat issues, I decided to use a regular desktop case.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
(Thus, the prepared computers)
</center>

Although a total of 3 computers were prepared, due to power supply, network configuration, and noise, it was determined that configuring with just one computer was best at this time.

Additionally, I intended to configure the cluster with Talos Linux, and since there are plans for future cluster expansion and migration,  
I chose to run Talos Linux on a hypervisor rather than installing it directly.

I selected Proxmox VE as the hypervisor because it is free to use, easy to install, and supports various storage options like ZFS and Ceph, as well as network virtualization features.  
Another major advantage was its intuitive dashboard UI, which makes management convenient.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)

<center style="font-size: 0.9em; color: #666;">
(Proxmox VE Dashboard)
</center>

While there are plans to expand the cluster using Proxmox VE's cluster features in the future,  
currently, since it is not completely stable with a single node, the plan is to manage the cluster state through ETCD backup and GitOps workflow.

In the next article, I'll talk about the process of installing Talos Linux on Proxmox VE and setting up a Kubernetes cluster!
