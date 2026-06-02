import { analyzeLiveCreator, decodeLiveReportId } from "@/lib/analyze";
import { resolveAnalysisBrandIds } from "@/lib/brands/store";
import { CreatorReportView } from "@/components/creator-report-view";
import { PlatformApiError } from "@/lib/platforms";
import { parseReportBrandIds } from "@/lib/report-id";
import { getSessionId } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LiveReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ brands?: string }>;
}) {
  const { id } = await params;
  const { brands: brandsParam } = await searchParams;
  const live = decodeLiveReportId(id);
  if (!live) notFound();

  const sessionId = await getSessionId();
  const brandIdsFromUrl = parseReportBrandIds(brandsParam);
  const brandIds = await resolveAnalysisBrandIds(sessionId, brandIdsFromUrl);

  try {
    const analysis = await analyzeLiveCreator(live.platform, live.handle, {
      sessionId,
      brandIds,
    });
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
