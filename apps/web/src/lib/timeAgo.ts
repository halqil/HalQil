/**
 * Sanani inson tushunadigan formatda qaytaradi:
 * - 1 soatdan kam: "X daqiqa oldin"
 * - 24 soatdan kam: "X soat oldin"
 * - 7 kundan kam: "X kun oldin"
 * - Undan ko'p: "DD.MM.YYYY"
 */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Hozirgina' : `${diffMins} daqiqa oldin`;
  }
  if (diffHours < 24) {
    return `${diffHours} soat oldin`;
  }
  if (diffDays < 7) {
    return `${diffDays} kun oldin`;
  }
  // DD.MM.YYYY
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
