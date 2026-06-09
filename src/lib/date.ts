/**
 * Formats a date or string to 'HH:mm' format using pt-BR locale.
 */
export function formatTime(date: Date | string | number | undefined | null): string {
  if (!date) return '--:--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--:--';
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Formats a date or string to 'DD/MM/YYYY HH:mm' format using pt-BR locale.
 */
export function formatDateTime(date: Date | string | number | undefined | null): string {
  if (!date) return '--/--/---- --:--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--/--/---- --:--';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a date to local date string 'DD/MM/YYYY'
 */
export function formatDate(date: Date | string | number | undefined | null): string {
  if (!date) return '--/--/----';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--/--/----';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to 'DD MMM, YYYY' format using pt-BR locale, but cleaned up.
 */
export function formatDateShort(date: Date | string | number | undefined | null): string {
  if (!date) return '--/---/----';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--/---/----';
  
  const formatted = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  // Remove " de " and "." to make it like "09 jun 2026"
  const clean = formatted.replace(/ de /g, ' ').replace(/\./g, '');
  const parts = clean.split(' ');
  if (parts.length >= 3) {
    // Captalize month and format as "09 Jun, 2026"
    const month = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${parts[0]} ${month}, ${parts[2]}`;
  }
  return clean;
}

/**
 * Converts a date to a local ISO string (YYYY-MM-DDTHH:mm) for datetime-local inputs.
 */
export function toLocalISO(date: Date | string | number | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}
