"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "?"
  );
}

export function ProfileAvatar({
  name,
  avatarUrl,
  avatarGradient,
  size = 64,
  className,
}: {
  name: string;
  avatarUrl?: string;
  avatarGradient: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => initialsFromName(name), [name]);
  const canUseImage = Boolean(avatarUrl && !failed);

  if (canUseImage) {
    return (
      <Image
        src={avatarUrl!}
        alt={`${name} profile`}
        width={size}
        height={size}
        unoptimized
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          "rounded-2xl border border-border object-cover shadow-sm",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border border-border bg-gradient-to-br text-sm font-semibold shadow-sm",
        avatarGradient,
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`${name} initials avatar`}
    >
      {initials}
    </div>
  );
}
