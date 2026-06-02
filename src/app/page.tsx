import Link from "next/link";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { GoogleSigninBanner } from "@/components/marketing/google-signin-banner";

export default function HomePage() {
  return (
    <>
      <GoogleSigninBanner />
      <HeroSection />
      <FeaturesSection />

      <section className="px-6 pb-24">
        <div className="glass-panel relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16 md:py-20">
          <h2 className="font-display text-3xl text-foreground md:text-4xl">
            Ready to score your next creator?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Paste a handle. Get authenticity, growth, brand match, and RankMint
            in seconds.
          </p>
          <Link
            href="/analyze"
            className="btn-primary-glow mt-8 inline-flex rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Start analyzing
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-white/50 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground md:flex-row md:text-left">
          <p className="font-display text-sm text-foreground">RankMint</p>
          <p>Live influencer intelligence · YouTube · X</p>
        </div>
      </footer>
    </>
  );
}
