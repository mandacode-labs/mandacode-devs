export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replaceAll(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}
