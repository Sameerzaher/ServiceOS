import { heUi } from "@/config";
import { ui } from "@/components/ui";

/** Server UI when Supabase public env is not set — avoids opaque 500s. */
export function PublicBookingEnvMissing() {
  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{heUi.publicBooking.invalidSlugTitle}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
          השירות אינו זמין כרגע (הגדרות שרת חסרות). פנו למנהל המערכת.
        </p>
      </header>
    </main>
  );
}
