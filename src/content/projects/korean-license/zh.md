---
sourceUrl: "https://github.com/sauce-git/korean-license-plate-detector"
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
teamSize: 1
order: 3
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
title: 韩语车牌检测器
description: 基于YOLO的韩文汽车车牌检测与识别系统
duration: 2023.04 - 2023.04
role: 全栈开发
---

韩国汽车车牌检测器是基于ONNX Runtime的实时图像处理管道，利用对象检测模型来寻找车牌并识别各个字符。采用将每个字符作为独立对象进行检测的方法，而不是传统的字符识别方式，即使在模糊的图像、倾斜的角度、部分遮挡等困难环境下也能实现高识别率。通过顺序应用三个专业化模型来检测车牌区域、进行透视校正，并最终识别字符，构成了一个三阶段的管道。

通过基于PySide6的GUI支持目录级批处理，并提供灵活的界面以便在检测失败时用户可以手动输入。处理结果会自动保存为Excel文件，并通过PyInstaller打包为单一可执行文件，可在实际现场立即使用。
