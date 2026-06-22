export function tryParseJson<T>(value: string | null | undefined): T | null {
  if (value === null || value === undefined || value === "") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function parseJsonOrThrow<T>(value: string, errorMessage: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(errorMessage);
  }
}
