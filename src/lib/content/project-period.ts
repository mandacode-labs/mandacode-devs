export function formatProjectPeriod(project: {
  startDate: string | null;
  endDate: string | null;
}): string {
  const { startDate, endDate } = project;
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} ~`;
  if (endDate) return `~ ${endDate}`;
  return "-";
}
