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
            tick={{ fill: "oklch(0.62 0.04 145)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.08 0.018 145)",
              border: "1px solid oklch(0.88 0.24 136 / 25%)",
              borderRadius: 8,
              fontSize: 12,
              color: "oklch(0.92 0.02 145)",
            }}
            formatter={(v) => [`${v}%`, "Impact"]}
          />
          <Bar dataKey="impact" fill="oklch(0.88 0.24 136)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
