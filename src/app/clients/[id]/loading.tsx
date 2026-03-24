import { heUi } from "@/config";
import { LoadingState, ui } from "@/components/ui";

export default function ClientProfileLoading() {
  return (
    <main className={ui.pageMain}>
      <LoadingState message={heUi.loading.default} />
    </main>
  );
}
