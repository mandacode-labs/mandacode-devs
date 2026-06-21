/**
 * Escapes curly braces in Mermaid diagram definitions so they can be used
 * inside node/edge labels without being parsed as rhombus shape markers.
 *
 * In Mermaid flowcharts, `{` and `}` are reserved for rhombus/decision nodes.
 * To include literal braces in labels, the official workaround is to use
 * HTML entity codes: `{` -> `#123;` and `}` -> `#125;`.
 *
 * Note: This means true rhombus nodes like `A{condition}` will also be
 * escaped. If rhombus support is needed, this helper should be replaced
 * with a parser-aware escape.
 */
export function escapeMermaidBraces(definition: string): string {
  return definition.replace(/{/g, "#123;").replace(/}/g, "#125;");
}
