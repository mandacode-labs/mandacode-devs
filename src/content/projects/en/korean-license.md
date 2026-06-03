---
title: Korean license plate detector
description: YOLO-based Korean License Plate Detection and Recognition System
sourceUrl: 'https://github.com/sauce-git/korean-license-plate-detector'
status: completed
techStack:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
duration: 2023.04 - 2023.04
teamSize: 1
role: 풀스택 개발
order: 3
lang: en
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
---

The Korean license plate detector is a real-time image processing pipeline based on ONNX Runtime,
that utilizes an object detection model to locate license plates and recognize individual characters.
It uses an approach that detects each character as an independent object, rather than traditional character recognition, to achieve recognition rates in difficult environments such as blurry images or tilted angles,
partial obscuration, and other difficult conditions.
It consists of a three-step pipeline that sequentially applies three specialized models to detect the license plate region, perform perspective correction, and finally recognize the characters.

Supports directory-by-directory batch processing through a PySide6-based GUI,
Provides a flexible interface for user input in case of detection failure.
The processing results are automatically saved in an excel file, and a single executable deployment using PyInstaller is available for immediate use in the field.
