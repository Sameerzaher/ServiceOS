import { heUi } from "@/config";
/** Server-only: do not import `@/components/ui` barrel — it re-exports client modules and can break RSC `clientModules` in production. */
import { ui } from "@/components/ui/theme";

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
