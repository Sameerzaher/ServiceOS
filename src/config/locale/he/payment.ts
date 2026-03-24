import { PaymentStatus } from "@/core/types/appointment";

/** Payment status labels (locale: Hebrew). Swap file or map for other locales later. */
export const PAYMENT_STATUS_LABELS_HE: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: "לא שולם",
  [PaymentStatus.Pending]: "בהמתנה",
  [PaymentStatus.Partial]: "תשלום חלקי",
  [PaymentStatus.Paid]: "שולם",
  [PaymentStatus.Refunded]: "הוחזר",
  [PaymentStatus.Waived]: "פטור מתשלום",
};

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS_HE[status];
}
