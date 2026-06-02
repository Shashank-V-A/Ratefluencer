import Link from "next/link";

export default function CallbackPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-display text-xl font-semibold">OAuth callback</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This page remains for legacy callback registration. YouTube Analytics
        OAuth now uses <code className="rounded bg-muted px-1">/api/oauth/youtube/callback</code>.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
