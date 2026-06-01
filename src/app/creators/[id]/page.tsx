import { notFound } from "next/navigation";
import { analyzeCreatorById } from "@/lib/analyze";
import { CreatorReportView } from "@/components/creator-report-view";

export async function generateStaticParams() {
  const { creators } = await import("@/lib/data/creators");
  return creators.map((c) => ({ id: c.id }));
}

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = analyzeCreatorById(id);
  if (!analysis) notFound();

  return <CreatorReportView analysis={analysis} />;
}
