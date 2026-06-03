---
title: "Korean License Plate Detector: A YOLO-based Object Detection OCR Pipeline"
description: >-
  Analyze the implementation of a three-step YOLO model pipeline, double OCR
  validation, PySide6 GUI, and real-time inference system based on ONNX Runtime.
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Python
  - YOLO
  - ONNX
  - Computer Vision
  - OCR
  - PySide6
lang: en
---

## enters

License plate recognition has traditionally used optical character recognition (OCR) technology, but performance degrades rapidly in blurry images, tilted angles, and partial occlusions. The project addressed these issues by adopting a YOLO-based approach to detect characters as objects rather than text. It applied three specialized models sequentially, ensured reliability with double OCR validation, and created a usable tool with a PySide6-based GUI.

## 3-step model pipeline

The entire pipeline is orchestrated by a single function: get_num() in detect.py. The three ONNX models are loaded as global singletons at the module level, and perform common preprocessing and postprocessing via the ONNXModel wrapper in model_loader.py.

The first model, plate_detect_v1, detects a single license plate region in the entire image. It's a YOLOv8-style object detector, which means that if it gets multiple candidates, it picks the one with the highest confidence and crops it. The second vertex_detect_v1 model detects four corners (TL, TR, BL, BR) in the cropped license plate image, each as a separate class. It uses the center of the bounding box of each corner as the vertex coordinates, and performs perspective correction with OpenCV's getPerspectiveTransform and warpPerspective. We geometrically validate the quadrilateral before calibration, falling back in case of anomalies.

The third model, syllable_detect_v1, is the core of character recognition. It detects each character (0-9 digits, Hangul syllables, and regional characters) as an independent object with 75 classes. Rather than reading lines of text like traditional OCR, it finds the bounding box within the license plate where each character is located. This allows us to recognize the remaining characters even when characters are irregularly spaced or some characters are obscured.

## Double OCR verification and character rearrangement

The most unique feature of the pipeline is the double OCR verification. Run syllable_detect_v1 on both versions of the image: the original cropped image and the perspective-corrected image. We validate both results with a regular expression, and if they match, we adopt the value. On mismatches, we prioritize the result that passes the regex, and if recognition of the corrected image fails, we use the result from the original image as a fallback.

After character detection, we remove redundant bounding boxes with non-maximum suppression (NMS) in number_detector.py. We then find the extreme left and right points and fit a straight line connecting them, separating them into two groups based on whether the y-center of each character lies above this line. The region names on Korean license plates (Seoul, Gyeonggi, etc.) are often located slightly above the main line, so we use this to separate the region name and number regions and rearrange them in x-coordinate order. The region names are calibrated against a hard-coded set of valid regions.

## PySide6 GUI and user experience

The GUI uses PySide6's QUiLoader to dynamically load form.ui. Image files or directories are selected with a QFileDialog, and batch processing is executed in a separate QThread so that the UI doesn't block. The progress is displayed in a progress bar, and the processing results are automatically saved as result.xlsx via openpyxl.

The main thing we cared about was the user experience in case of detection failures. If the license plate is not found in a particular image during batch processing, the worker thread returns with None in the result, and the main thread switches to a modal input state via QEventLoop. This displays the problem image on the screen and pauses processing until the user manually enters the license plate number and presses the OK button. This achieves 100% coverage while maintaining the efficiency of automation.

## Optimize deployment with ONNX Runtime

All models run with ONNX Runtime's CPUExecutionProvider. Preprocessing applies a common YOLO standard letterbox resize (gray 114 padding), BGR->RGB conversion, normalization, and CHW conversion. In post-processing, we implemented lightweight implementations of the YOLOResult, YOLOBoxes, and YOLOBox classes similar to the Ultralytics API so that the code in detect.py reads similarly to the actual ultralytics package. This eliminated the need to import torch or ultralytics at runtime, significantly reducing the size of the PyInstaller binary.

The model is automatically downloaded from the Hugging Face Hub. You can specify the model repository with the HF_MODEL_REPO environment variable, and they are cached in the local .cache/models to avoid re-downloading. The PyInstaller spec specifies exclusions for large libraries such as torch, tensorflow, matplotlib, and pandas to lighten the final binary. The GitHub Actions workflow automatically builds and uploads releases for Linux, macOS, and Windows to GitHub Releases on v\* tag pushes.

## Tradeoffs and design philosophy

While YOLO-based character detection is more robust to irregular spacing and occlusions than traditional OCR, it can be relatively poor at recognizing details in small characters. To compensate for this, we introduced double OCR, regular expression verification, and a fallback mechanism. In addition, the NMS threshold of 0.3 was set as a balance between deduplication and miss prevention for license plates with high character overlap.

The modal input approach in the GUI may seem a bit simplistic in terms of user experience, but it is a practical choice for handling edge cases that cannot be fully automated in a real production environment. The hybrid approach, which maintains the continuity of batch processing while only engaging the user when manual intervention is required, achieves both data quality and processing efficiency.

## Conclusion.

This project goes beyond a simple deep learning demo towards a tool that can be used in the real world. The modularity of the three-step model pipeline, the reliability of the double validation, the usability of the PySide6 GUI, and the cross-platform deployment with PyInstaller and GitHub Actions are all designed with the entire lifecycle in mind. This is an example of the full potential of YOLO object detection in the narrow domain of license plate recognition.
