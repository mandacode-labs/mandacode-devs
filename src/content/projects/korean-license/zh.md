---
title: 韩国车牌检测器
description: 基于YOLO的韩国车牌检测与识别系统
sourceUrl: "https://github.com/sauce-git/korean-license-plate-detector"
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
duration: 2023.04 - 2023.04
teamSize: 1
role: 全栈开发
order: 3
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
---

韩国车牌检测器是基于ONNX Runtime的实时图像处理管道，利用目标检测模型来寻找车牌并识别单个字符。与传统的字符识别方法不同，该系统采用将每个字符作为独立对象进行检测的方法，即使在模糊图像、倾斜角度或部分遮挡等困难环境下也能实现高识别率。系统由三个专业化模型顺序应用组成三阶段管道，分别用于检测车牌区域、进行透视校正，最终识别字符。

基于PySide6的GUI支持目录级批处理，并提供灵活的界面以便在检测失败时用户可以手动输入。处理结果自动保存为Excel文件，并通过PyInstaller打包为单个可执行文件，便于在实际现场立即使用。
