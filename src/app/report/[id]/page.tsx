import { analyzeLiveCreator, decodeLiveReportId } from "@/lib/analyze";
import { CreatorReportView } from "@/components/creator-report-view";
import { PlatformApiError } from "@/lib/platforms";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LiveReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const live = decodeLiveReportId(id);
  if (!live) notFound();

  try {
    const analysis = await analyzeLiveCreator(live.platform, live.handle);
    return (
      <CreatorReportView
        analysis={analysis}
        backHref="/analyze"
        backLabel="Back to analyze"
      />
    );
  } catch (e) {
    if (e instanceof PlatformApiError) {
      return (
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <h1 className="font-display text-xl font-semibold">{e.message}</h1>
          {e.hint && (
            <p className="mt-3 text-sm text-muted-foreground">{e.hint}</p>
          )}
          <p className="mt-6 text-sm text-muted-foreground">
            Check <code className="rounded bg-muted px-1">.env.local</code> and
            restart the dev server.
          </p>
        </div>
      );
    }
    throw e;
  }
}
