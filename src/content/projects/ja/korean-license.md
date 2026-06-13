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
lang: ja
blogUrl: /ko/blog/korean-license-plate-deep-dive
coverImage: >-
  https://static.mandacode.com/mandacode-devs/projects/korean-license-plate/cover.png
title: 韓国語の自動車ナンバープレート検出器
description: YOLOベースの韓国語自動車ナンバープレート検出および認識システム
duration: 2023.04 - 2023.04
role: フルスタック開発
---

韓国語の自動車ナンバープレート検出器は、ONNX Runtimeを基盤としたリアルタイム画像処理パイプラインであり、オブジェクト検出モデルを活用してナンバープレートを見つけ、個別の文字を認識します。従来の文字認識方式ではなく、各文字を独立したオブジェクトとして検出するアプローチを使用することで、ぼやけた画像や傾いた角度、部分的な隠れなど困難な環境でも高い認識率を達成します。3つの専門化されたモデルを順次適用してナンバープレート領域を検出し、遠近補正を行い、最終的に文字を認識する3段階のパイプラインで構成されています。

PySide6を基盤としたGUIを通じてディレクトリ単位のバッチ処理をサポートし、検出失敗時にはユーザーが直接入力できるように柔軟なインターフェースを提供します。処理結果はExcelファイルに自動保存され、PyInstallerを活用した単一実行ファイルの配布により、実際の現場で即座に使用可能です。
