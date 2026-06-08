---
pubDate: 2026-06-02T00:00:00.000Z
tags:
  - Python
  - YOLO
  - ONNX
  - Computer Vision
  - OCR
lang: en
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
title: License Plate Recognition Problem Solved with YOLO Object Detection
description: >-
  A Practical License Plate Recognition System Using a YOLO-Based 3-Step
  Pipeline Beyond the Limitations of Traditional OCR
---
## Problem Awareness

Traditional OCR works well on clean documents but is vulnerable to blurry and tilted images like license plates. If the spacing between characters is irregular or some parts are obscured, recognition rates plummet. Additionally, Korean car license plates have diverse character arrangements and mix region names with numbers, presenting limitations for general OCR models.

This project views characters as objects rather than text. Using YOLO-based object detection, each character is independently identified, and OCR is performed on both the original and corrected images for dual verification. NMS and extremum-based line fitting separate region names and numbers, ensuring robust performance even in environments where traditional OCR fails.

## Three-Stage Pipeline: The Art of Division of Labor

The entire flow is controlled by the `get_num()` function in `detect.py`. Three ONNX models handle their respective areas of expertise.

| Stage | Model                | Role                             |
| ----- | -------------------- | -------------------------------- |
| 1     | `plate_detect_v1`    | Detect license plate area in the full image |
| 2     | `vertex_detect_v1`   | Detect four corners and perform perspective correction |
| 3     | `syllable_detect_v1` | Detect individual characters as 75 classes |

The first model finds one license plate area in the full image. It selects the most reliable candidate among several and crops it. The second model finds the four corners in the cropped image and performs perspective correction. The third model detects individual characters as objects in 75 classes. Unlike traditional OCR, which reads text lines, it finds the position of each character within the license plate, allowing recognition even if spacing is irregular or some parts are obscured.

All models run on ONNX Runtime, and the PyInstaller binary excludes torch or ultralytics to minimize size.

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

## Verification and Fallback: Balancing Stability and Efficiency

Perspective transformation is not always perfect. Corner detection may fail, or skewed license plates may be encountered.

This project **prioritizes OCR on warped images**, returning results immediately if regex validation passes. Only if it fails does it fallback to the original cropped image for additional OCR.

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
    """Regex validation + mask application on a single OCR result"""
    if plate_num is None:
        plate_num = ''

    m = re.fullmatch(PLATE_REGEX, plate_num)
    if m is None:
        return None

    if mask:
        plate_num = re.search(OUTPUT_REGEX, plate_num).group()

    return plate_num
```

This method processes with a single OCR if warping succeeds, and only falls back to the cropped image if it fails. It reduces unnecessary inference while maintaining stability.

After character detection, duplicate bounding boxes are removed using NMS, and lines are drawn based on the left and right endpoints to separate region names and number areas. Region names are corrected by comparing with a hardcoded list of valid regions like Seoul, Gyeonggi, and Busan.

```mermaid
sequenceDiagram
    participant Detect as detect.py
    participant ONNX as ONNX Runtime
    participant Validate as validate_plate_num

    Detect->>ONNX: Recognize characters on warped image
    ONNX-->>Detect: Result
    Detect->>Validate: Regex Validation

    alt Validation Passes
        Validate-->>Detect: Return Final Number
    else Validation Fails
        Detect->>ONNX: Recognize characters on cropped image
        ONNX-->>Detect: Result
        Detect->>Validate: Regex Validation
        alt Validation Passes
            Validate-->>Detect: Return Final Number
        else
            Validate-->>Detect: Return Failure
        end
    end
```

## User-Friendly GUI Design

What should be done if some images fail detection during batch processing? Ignoring them lowers data quality, while stopping the entire process reduces efficiency.

The PySide6-based GUI automatically pauses upon detection failure and displays the image on the screen. Processing halts until the user manually inputs the license plate number and presses the confirm button. This hybrid approach achieves 100% coverage while maintaining batch processing efficiency. Results are automatically saved to result.xlsx via openpyxl, and progress is visualized with a progress bar.

## Deployment: Ready for Immediate Use

A single executable file is generated using PyInstaller. Large libraries like torch, tensorflow, and matplotlib are explicitly excluded to minimize binary size. All ONNX models are automatically downloaded from the Hugging Face Hub and stored in a local cache to prevent re-downloads.

GitHub Actions automatically build releases for Linux, macOS, and Windows upon pushing v\* tags, uploading them to GitHub Releases. Users can simply extract and run.

## Trade-offs and Design Philosophy

YOLO-based character detection is strong against irregular spacing and occlusion but may have lower fine recognition rates for small characters compared to traditional OCR. To compensate, the mechanism prioritizes OCR on warped images and immediately returns results if regex validation passes, only falling back to cropped images if it fails. An NMS threshold of 0.3 balances duplicate removal and omission prevention in license plates with many overlapping characters.

The modal input method of the GUI may seem outdated, but it is a practical choice for handling edge cases where full automation is impossible in real operational environments. Balancing data quality and processing efficiency is the core philosophy of this project.

## Conclusion

This project aims to be a tool usable in real-world scenarios beyond a simple deep learning demo. The modularization of the three-stage model pipeline, the stability of prioritizing warped image processing and fallback, the usability of the PySide6 GUI, and the cross-platform deployment using PyInstaller and GitHub Actions all highlight a design considering the entire lifecycle. It is a case that maximizes the potential of object detection in the narrow domain of license plate recognition.
