---
title: Korean License Plate Detector
description: YOLO-based Korean license plate detection and recognition system
sourceUrl: 'https://github.com/sauce-git/korean-license-plate-detector'
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
duration: 2023.04 - 2023.04
teamSize: 1
role: Full-stack Development
order: 3
lang: en
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
---
The Korean License Plate Detector is a real-time image processing pipeline based on ONNX Runtime, utilizing an object detection model to locate license plates and recognize individual characters. By adopting an approach that detects each character as an independent object rather than using traditional character recognition methods, it achieves high recognition rates even in challenging conditions such as blurry images, tilted angles, or partial obstructions. The system is structured as a three-stage pipeline that sequentially applies three specialized models to detect the license plate area, perform perspective correction, and finally recognize the characters.

The GUI, built with PySide6, supports batch processing by directory and offers a flexible interface that allows users to manually input data in case of detection failure. The processing results are automatically saved as an Excel file, and the deployment as a single executable file using PyInstaller enables immediate use in real-world scenarios.
