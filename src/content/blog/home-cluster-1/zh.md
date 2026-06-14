---
title: "家庭集群构建 1: 硬件选择与网络配置"
description: 基于Proxmox VE的家庭集群构建过程中硬件选择与网络配置
pubDate: 2026-06-03T00:00:00.000Z
tags:
  - Proxmox
  - Home Lab
coverImage: "https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/blog-cover.png"
---

为了处理各种项目运营、开发和测试工作负载，以及个人学习和实验，我希望在AWS EKS上处理所有这些。

但是……云服务很贵。~~（非常贵。）~~

由于主要是用于个人服务和开发的集群，我认为EKS过于奢侈。

因此，我决定构建一个家庭集群，但家庭服务器的构建也不是一件容易的事。  
虽然购买专业硬件并安装在机架上进行操作是理想的，但在家里无法做到这一点。  
价格、噪音、散热、空间等都有诸多限制。

为了选择最佳解决方案，我设定了以下标准：

- **价格**: 不应过于昂贵。
- **噪音**: 应该安静到几乎听不见。
- **散热**: 应该在普通家庭可以承受的范围内。
- **空间**: 应该可以安装在小空间内。
- **性能**: 应该能够处理在EKS上运行的工作负载。

尤其是价格限制最大。在当前情况下，以最低成本构建服务器是目标。

因此，我在阿里上以低价购买了英特尔至强E5系列和中国制造的主板，以及ECC内存，  
由于噪音和散热问题，服务器机箱决定使用普通台式机机箱。

![硬件](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/home-cluster-01.jpg)

<center style="font-size: 0.9em; color: #666;">
（准备好的电脑）
</center>

虽然准备了总共3台电脑，但由于电力供应、网络配置和噪音，目前判断使用1台进行配置是最好的。

此外，我计划用Talos Linux来配置集群，由于未来有集群扩展和迁移计划，因此选择在虚拟机管理程序上运行Talos Linux，而不是直接安装。

我选择了Proxmox VE作为虚拟机管理程序，因为它可以免费使用，安装简单，并支持ZFS、Ceph等多种存储选项和网络虚拟化功能。  
此外，仪表板UI直观，便于管理，这也是一个很大的优点。

![Proxmox VE 仪表板](https://static.mandacode.com/mandacode-devs/blog/home-cluster-1/proxmox-dashboard.png)

<center style="font-size: 0.9em; color: #666;">
（Proxmox VE 仪表板）
</center>

虽然计划在未来利用Proxmox VE的集群功能扩展集群，  
但目前由于单节点尚未完全稳定，因此计划通过ETCD备份和GitOps工作流来管理集群状态。

在下一篇文章中，我将讨论在Proxmox VE上安装Talos Linux并配置Kubernetes集群的过程！
