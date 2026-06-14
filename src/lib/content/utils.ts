export function getSlugFromEntryId(entryId: string): string {
  return entryId.split("/").pop() ?? entryId;
}

export function getLangFromEntryId(entryId: string): string {
  return entryId.split("/")[0] ?? entryId;
}
