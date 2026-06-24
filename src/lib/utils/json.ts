export function parseJsonOrThrow<T>(value: string, errorMessage: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(errorMessage);
  }
}
