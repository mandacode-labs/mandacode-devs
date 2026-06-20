---
title: 韓国語自動車ナンバープレート検出器
description: YOLOベースの韓国語自動車ナンバープレート検出および認識システム
sourceUrl: "https://github.com/sauce-git/korean-license-plate-detector"
status: completed
tags:
  - Python
  - ONNX Runtime
  - YOLO
  - PySide6
duration: 2023.04 - 2023.04
teamSize: 1
role: フルスタック開発
order: 3
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
---

韓国語自動車ナンバープレート検出器は、ONNX Runtimeベースのリアルタイム画像処理パイプラインで、オブジェクト検出モデルを活用してナンバープレートを見つけ、個々の文字を認識します。従来の文字認識方式とは異なり、各文字を独立したオブジェクトとして検出するアプローチを使用し、ぼやけた画像や傾いた角度、部分的な隠れなどの困難な環境でも高い認識率を達成します。3つの専門化されたモデルを順次適用してナンバープレート領域を検出し、遠近補正を行い、最終的に文字を認識する3段階のパイプラインで構成されています。

PySide6ベースのGUIを通じてディレクトリ単位のバッチ処理をサポートし、検出失敗時にはユーザーが直接入力できる柔軟なインターフェースを提供します。処理結果はExcelファイルに自動保存され、PyInstallerを活用した単一実行ファイル配布で実際の現場で即時使用可能です。
