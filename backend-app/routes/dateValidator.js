export function isValidDate(dateStr) {
  if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
  
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}