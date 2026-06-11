---
sourceUrl: 'https://github.com/sauce-git/korean-license-plate-detector'
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
teamSize: 1
order: 3
lang: en
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
title: Korean License Plate Detector
description: YOLO-based Korean License Plate Detection and Recognition System
duration: April 2023 - April 2023
role: Full-stack development
---
The Korean vehicle license plate detector is a real-time image processing pipeline based on ONNX Runtime. It uses an object detection model to locate license plates and recognize individual characters. Instead of traditional character recognition methods, it adopts an approach that detects each character as an independent object, achieving high recognition rates even in challenging conditions such as blurry images, tilted angles, or partial obstructions. The pipeline consists of three specialized models applied sequentially to detect the license plate area, perform perspective correction, and finally recognize the characters.

With a GUI based on PySide6, it supports batch processing by directory and provides a flexible interface allowing users to manually input data if detection fails. The processing results are automatically saved in an Excel file, and with distribution as a single executable file using PyInstaller, it can be immediately used on-site.
