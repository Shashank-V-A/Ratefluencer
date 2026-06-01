"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function FeatureImportanceChart({
  data,
}: {
  data: { feature: string; impact: number }[];
}) {
  return (
    <div className="h-64 min-h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height={256} minWidth={0}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            type="category"
            dataKey="feature"
            width={120}
            tick={{ fill: "oklch(0.65 0 0)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.18 0.015 50)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [`${v}%`, "Impact"]}
          />
          <Bar dataKey="impact" fill="oklch(0.72 0.14 45)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
