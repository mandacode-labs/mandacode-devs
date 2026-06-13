---
pubDate: 2026-06-03T00:00:00.000Z
tags:
  - Proxmox
  - Home Lab
lang: zh
coverImage: "https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png"
title: 构建家庭集群1：硬件选择与网络配置
description: 在基于Proxmox VE的家庭集群构建过程中进行硬件选择和网络配置
---

为了处理各种项目运营、开发和测试工作负载，以及个人学习和实验，我决定在AWS EKS上进行所有操作。

但是……云服务很贵。~~（非常贵。）~~

反正主要是个人服务和开发用的集群，我认为EKS有点过头了。

所以我决定构建一个家庭集群（但）搭建家庭服务器也不是件容易的事。<br>
虽然购买专业硬件并安装在机架上运行是不错的选择，但在家里这样做是不现实的。
价格、噪音、散热、空间等都有很多限制。

为了选择最佳解决方案，我设定了以下标准：

- **价格**：不能太贵
- **噪音**：要安静到几乎听不见
- **散热**：要在普通家庭能承受的范围内
- **空间**：要能安装在小空间内
- **性能**：要能承受EKS上运行的工作负载

特别是价格限制最大。在目前的情况下，目标是以最低的成本构建服务器。

因此，我在阿里巴巴上以低价购买了英特尔至强E5系列和中国制造的主板以及ECC内存，
由于噪音和散热问题，服务器机箱决定使用普通台式机机箱。

![硬件](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
（准备好的电脑）
</center>

虽然准备了总共3台电脑，但由于电力供应、网络配置和噪音问题，目前判断只用1台来配置是最好的。

此外，我打算用Talos Linux来构建集群，由于有未来扩展和迁移计划，所以选择在虚拟机管理程序上运行Talos Linux，而不是直接安装。

我选择了Proxmox VE作为虚拟机管理程序，因为它可以免费使用，安装简单，并支持ZFS、Ceph等多种存储选项和网络虚拟化功能。
另外，仪表板UI直观，管理方便也是一个很大的优点。

![Proxmox VE 仪表板](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)

<center style="font-size: 0.9em; color: #666;">
（Proxmox VE 仪表板）
</center>

虽然计划以后利用Proxmox VE的集群功能来扩展集群，但目前由于单节点尚不完全稳定，因此计划通过ETCD备份和GitOps工作流程来管理集群状态。

在下一篇文章中，我将讨论在Proxmox VE上安装Talos Linux并配置Kubernetes集群的过程！
