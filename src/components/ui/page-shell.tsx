import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  narrow,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cn("px-6 py-14 md:py-20", className)}>
      <div
        className={cn(
          "mx-auto",
          narrow ? "max-w-2xl" : wide ? "max-w-6xl" : "max-w-4xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PageTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="mb-10">
      <h1 className="font-display text-3xl text-foreground md:text-4xl">
        {children}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </header>
  );
}

export function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel rounded-2xl p-6 md:p-8", className)}>
      {children}
    </div>
  );
}
