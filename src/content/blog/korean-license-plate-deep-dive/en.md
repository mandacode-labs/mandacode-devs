---
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Python
  - YOLO
  - ONNX
  - Computer Vision
  - OCR
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
title: License Plate Recognition Problem Solved with YOLO Object Detection
description: >-
  A Practical License Plate Recognition System Using a YOLO-Based 3-Step
  Pipeline to Overcome the Limitations of Traditional OCR
---

## Problem Awareness

Traditional OCR works well on clean documents but is vulnerable to blurry and tilted images like license plates. The recognition rate drops sharply if the character spacing is irregular or partially obscured. Additionally, Korean car license plates have diverse arrangements of characters, mixing region names and numbers, which posed limitations for general OCR models.

This project adopts a perspective that views characters as objects rather than text. It uses YOLO-based object detection to independently find each character and performs OCR on both the original and corrected images for dual verification. It separates region names and numbers using NMS and extremum-based line fitting, operating robustly even in environments where traditional OCR fails.

## Three-Step Pipeline: The Art of Division of Labor

The entire flow is controlled by a single function, `get_num()`, in `detect.py`. Three ONNX models handle their respective areas of expertise.

| Step | Model                | Role                                                     |
| ---- | -------------------- | -------------------------------------------------------- |
| 1    | `plate_detect_v1`    | Detects license plate area in the entire image           |
| 2    | `vertex_detect_v1`   | Detects four corners and performs perspective correction |
| 3    | `syllable_detect_v1` | Detects individual characters with 75 classes            |

The first model finds one license plate area in the entire image, selecting the most reliable candidate among several and cropping it. The second model detects the four corners in the cropped image and performs perspective correction. The third model detects individual characters as objects with 75 classes. Unlike traditional OCR, which reads text lines, it finds the position of each character within the license plate, allowing recognition even if character spacing is irregular or partially obscured.

All models run on ONNX Runtime, and the PyInstaller binary does not include torch or ultralytics, minimizing size.

```mermaid
graph LR
    Input[Input Image] --> Plate[License Plate Detection]
    Plate --> Crop[License Plate Crop]
    Crop --> Vertex[Corner Detection]
    Vertex --> Warp[Perspective Correction]
    Warp --> OCR1[warped OCR]
    OCR1 --> Validate1[Regex Validation]
    Validate1 -->|Pass| Output[Final Number]
    Validate1 -->|Fail| OCR2[cropped OCR]
    Crop --> OCR2
    OCR2 --> Validate2[Regex Validation]
    Validate2 --> Output
```

## Validation and Fallback: Balancing Stability and Efficiency

Perspective transformation is not always perfect. Corner detection may fail, or you may encounter tilted license plates.

This project **prioritizes OCR on warped images** and immediately returns results if regex validation passes. If it fails, it falls back to the original cropped image to perform additional OCR.

```python
def get_num(img):
    cropped = plate_detector.detect_and_crop(img)
    warped = vertex_detector.detect_and_warp(cropped)

    # Step 1: Prioritize OCR on warped image
    if warped is not None:
        res = syllable_detector.get_num_from_img(warped)
        result = validate_plate_num(res, mask=False)
        if result:
            return result

    # Step 2: Fallback - OCR on cropped image
    if cropped is not None:
        res = syllable_detector.get_num_from_img(cropped)
        result = validate_plate_num(res, mask=False)
        if result:
            return result

    return None

def validate_plate_num(plate_num, mask=True):
    """Regex validation + mask application on single OCR result"""
    if plate_num is None:
        plate_num = ''

    m = re.fullmatch(PLATE_REGEX, plate_num)
    if m is None:
        return None

    if mask:
        plate_num = re.search(OUTPUT_REGEX, plate_num).group()

    return plate_num
```

This approach processes with a single OCR if warping succeeds and falls back to the cropped image only when it fails. It's designed to reduce unnecessary inferences while maintaining stability.

After character detection, it removes duplicate bounding boxes with NMS and draws lines based on the left and right endpoints to separate region names and number areas. Region names are corrected by comparing them with a hardcoded list of valid regions like Seoul, Gyeonggi, and Busan.

```mermaid
sequenceDiagram
    participant Detect as detect.py
    participant ONNX as ONNX Runtime
    participant Validate as validate_plate_num

    Detect->>ONNX: Recognize characters on warped image
    ONNX-->>Detect: Result
    Detect->>Validate: Regex validation

    alt Validation Passes
        Validate-->>Detect: Return final number
    else Validation Fails
        Detect->>ONNX: Recognize characters on cropped image
        ONNX-->>Detect: Result
        Detect->>Validate: Regex validation
        alt Validation Passes
            Validate-->>Detect: Return final number
        else
            Validate-->>Detect: Return failure
        end
    end
```

## User-Friendly GUI Design

What should be done if some images fail to detect during batch processing? Ignoring them reduces data quality, and stopping the entire process reduces efficiency.

The PySide6-based GUI automatically pauses when detection fails and displays the image. Processing stops until the user manually enters the license plate number and presses the confirm button. This hybrid approach achieves 100% coverage while maintaining batch processing efficiency. Results are automatically saved to result.xlsx via openpyxl, and progress is visualized with a progress bar.

## Deployment: Ready for Field Use

A single executable file is generated with PyInstaller. Large libraries like torch, tensorflow, and matplotlib are explicitly excluded to minimize binary size. All ONNX models are automatically downloaded from the Hugging Face Hub and stored in the local cache to prevent re-downloads.

GitHub Actions automatically build releases for Linux, macOS, and Windows upon v\* tag push and upload them to GitHub Releases. Users can extract and run them immediately.

## Trade-offs and Design Philosophy

YOLO-based character detection is strong against irregular spacing and occlusion but may have lower fine recognition rates for small characters compared to traditional OCR. To compensate, the mechanism prioritizes OCR on warped images and immediately returns results if regex validation passes, falling back to the cropped image only if it fails. The NMS threshold of 0.3 balances duplicate removal and omission prevention on license plates with many overlapping characters.

The modal input method of the GUI may seem somewhat outdated, but it is a practical choice to handle edge cases where full automation is impossible in real operational environments. Balancing data quality and processing efficiency is the core philosophy of this project.

## Conclusion

This project aims to be a practical tool usable in real-world settings, beyond a simple deep learning demo. The modularization of the three-step model pipeline, the stability of prioritizing warped image processing and fallback, the usability of the PySide6 GUI, and the cross-platform deployment using PyInstaller and GitHub Actions all reflect a design that considers the entire lifecycle. It is a case that maximizes the potential of object detection in the narrow domain of license plate recognition.
