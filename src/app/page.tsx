import Link from "next/link";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />

      <section className="px-6 pb-24">
        <div className="glass-panel relative mx-auto max-w-6xl overflow-hidden px-8 py-14 text-center md:px-16 md:py-20">
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-normal tracking-tight md:text-4xl">
              Ready to score your next creator?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Paste a handle. Get authenticity, growth, brand match, and
              RankMint™ in seconds.
            </p>
            <Link
              href="/analyze"
              className="btn-primary-glow mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Start analyzing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground md:flex-row md:text-left">
          <p className="font-display text-sm text-foreground/80">
            RankMint
          </p>
          <p>Live micro-UGC intelligence · YouTube · X · Instagram</p>
        </div>
      </footer>
    </>
  );
}
