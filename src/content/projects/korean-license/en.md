---
title: Korean License Plate Detector
description: YOLO-based Korean license plate detection and recognition system
sourceUrl: "https://github.com/sauce-git/korean-license-plate-detector"
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
duration: 2023.04 - 2023.04
teamSize: 1
role: Full-stack Developer
order: 3
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
---

The Korean License Plate Detector is a real-time image processing pipeline based on ONNX Runtime, which uses an object detection model to locate license plates and recognize individual characters. Unlike traditional character recognition methods, this approach detects each character as an independent object, achieving high recognition rates even in challenging conditions such as blurry images, tilted angles, or partial obstructions. It consists of a three-step pipeline that sequentially applies three specialized models to detect the license plate area, perform perspective correction, and finally recognize the characters.

The GUI, based on PySide6, supports batch processing by directory and provides a flexible interface allowing users to manually input data in case of detection failure. The results are automatically saved in an Excel file, and the application can be deployed as a single executable file using PyInstaller for immediate use in real-world scenarios.
