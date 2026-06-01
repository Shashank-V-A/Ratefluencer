import { notFound } from "next/navigation";
import {
  analyzeCreatorById,
  analyzeLiveCreator,
  decodeLiveReportId,
} from "@/lib/analyze";
import { CreatorReportView } from "@/components/creator-report-view";
import { PlatformApiError } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export default async function LiveReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const live = decodeLiveReportId(id);
  if (live) {
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
            <a href="/settings" className="mt-6 inline-block text-primary hover:underline">
              API setup guide
            </a>
          </div>
        );
      }
      throw e;
    }
  }

  const demo = analyzeCreatorById(id);
  if (!demo) notFound();

  return <CreatorReportView analysis={demo} />;
}
