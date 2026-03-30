/**
 * Builds a wa.me link for WhatsApp Web / app.
 * Optimized for Israeli numbers (972); avoids double-prefixing when 972 is already present.
 */
export function buildWhatsAppHref(phone: string, message?: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  while (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("972")) {
    const base = `https://wa.me/${digits}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  if (digits.startsWith("0")) {
    const base = `https://wa.me/972${digits.slice(1)}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  if (digits.length === 9 && digits.startsWith("5")) {
    const base = `https://wa.me/972${digits}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
