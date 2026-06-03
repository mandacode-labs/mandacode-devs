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
coverImage: 'https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png'
---

We wanted to run a variety of projects, handle development and test workloads, and do it all on AWS EKS for personal learning and experimentation.

But... The cloud is expensive (a lot of it).

We decided that EKS was overkill for a cluster that was primarily for personal services and development anyway.

So I decided to build a home cluster (but building a home server is not an easy task either)<br>
It would be nice to be able to buy specialized hardware, install it on a rackmount, and run it, but you can't do that at home.
There are many constraints: price, noise, heat, space, etc.

To choose the best solution, we set the following criteria:

- **Price**: It shouldn't be too expensive.
- Noise: It should be quiet enough to be almost inaudible
- Heat generation: it should be manageable for the average household
- Space: it should be able to fit in small spaces
- Performance: It should be able to handle the workloads that the EKS is running

Price was the biggest constraint - the goal was to build the server for the least amount of money possible at this point.

So we bought a cheap Intel Xeon E5 series, a Chinese motherboard, and ECC memory from Ali,
For the server case, we decided to use a regular desktop case due to noise and heat issues.

![Hardware](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;"><center style="font-size: 0.9em; color: #666;">
(And so the computers are ready)
</center>.

We had a total of three computers ready to go, but due to power, network configuration, and noise, we decided it was better to go with just one at this point.

We also wanted to configure the cluster with Talos Linux, and since we have plans to expand and move the cluster in the future, we decided to install Talos Linux on top of the hypervisor rather than installing it directly.
hypervisor on top of Talos Linux, rather than installing Talos Linux directly.

I chose Proxmox VE for the hypervisor because it's free to use, simple to install, and supports a variety of storage options including ZFS and Ceph, as well as network virtualization capabilities.
It also has an intuitive dashboard UI, making it easy to manage, which was a big plus.

![Proxmox VE Dashboard](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)
<center style="font-size: 0.9em; color: #666;">
(Proxmox VE dashboard)
</center> </center>

While we plan to utilize the Proxmox VE cluster feature in the future to scale our cluster,
For now, we'll be operating with ETCD backups and GitOps workflows to manage the health of the cluster, as it's not completely reliable with a single node.

In the next post, we'll talk about how we installed Talos Linux on top of Proxmox VE and configured our Kubernetes cluster!
