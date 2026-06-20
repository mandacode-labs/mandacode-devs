export function formatProjectPeriod(project: {
  duration: string;
  startDate: string | null;
  endDate: string | null;
}): string {
  const { duration, startDate, endDate } = project;
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} ~`;
  if (endDate) return `~ ${endDate}`;
  return duration || "-";
}
