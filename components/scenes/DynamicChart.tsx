"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SceneData, DataPoint, TargetRow } from "@/hooks/useVoiceBrain";

interface DynamicChartProps {
  scene: SceneData;
}

export function DynamicChart({ scene }: DynamicChartProps) {
  const data = scene.data ?? [];
  switch (scene.chart_type) {
    case "bar":
      return <BarChart data={data} annotation={scene.annotation} source={scene.source} />;
    case "metric":
      return <MetricCards data={data} annotation={scene.annotation} source={scene.source} />;
    case "line":
      return <LineChart data={data} annotation={scene.annotation} source={scene.source} />;
    case "donut":
      return <DonutChart data={data} annotation={scene.annotation} source={scene.source} />;
    case "targets":
      return <TargetTable targets={scene.targets ?? []} annotation={scene.annotation} source={scene.source} />;
    case "thesis":
      return <ThesisCard pillars={scene.pillars ?? []} annotation={scene.annotation} source={scene.source} />;
    case "risks":
      return <RisksCard risks={scene.risks ?? []} annotation={scene.annotation} source={scene.source} />;
    case "catalysts":
      return <CatalystsTimeline timeline={scene.timeline ?? []} annotation={scene.annotation} source={scene.source} />;
    default:
      return <BarChart data={data} annotation={scene.annotation} source={scene.source} />;
  }
}

// ─── Bar Chart ───────────────────────────────────────────────

function BarChart({ data, annotation, source }: { data: DataPoint[]; annotation?: string; source?: string }) {
  const prefersReduced = useReducedMotion();
  const maxValue = Math.max(...data.map((d) => d.value));
  // 160px bar area (was 180). Trimmed universally so the bar chart + a two-line
  // annotation + a source line + 3 follow-up chips all fit inside the dvh-bound
  // scene window on iPhone without the third chip getting pushed under the orb.
  // Desktop is unaffected visually — bars stay readable.
  const BAR_AREA_HEIGHT = 160;

  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <div className="flex items-end gap-[5px] max-md:gap-[3px]">
        {data.map((d, i) => {
          const barH = maxValue > 0 ? (d.value / maxValue) * BAR_AREA_HEIGHT : 0;
          const isLast = i === data.length - 1;
          const isHighlight = d.highlight ?? isLast;

          return (
            <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-2 min-w-0 max-md:gap-1">
              <motion.span
                className="text-[10px] tabular-nums whitespace-nowrap max-md:text-[8px]"
                style={{ color: isHighlight ? "#d4a84a" : "#706050", fontWeight: isHighlight ? 500 : 400 }}
                initial={prefersReduced ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReduced ? { duration: 0 } : { delay: i * 0.04 + 0.4 }}
              >
                {formatValue(d.value, d.unit)}
              </motion.span>

              <motion.div
                className="w-full rounded-t-[4px] max-md:rounded-t-[3px]"
                style={{
                  background: isHighlight
                    ? "linear-gradient(to top, rgba(200, 160, 60, 0.85), rgba(200, 160, 60, 0.5))"
                    : "linear-gradient(to top, rgba(200, 160, 60, 0.3), rgba(200, 160, 60, 0.1))",
                  minHeight: 2,
                }}
                initial={prefersReduced ? { height: barH } : { height: 0 }}
                animate={{ height: barH }}
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : { duration: 0.7, delay: i * 0.04, ease: [0.34, 1.56, 0.64, 1] }
                }
              />

              <span
                className="text-[9px] tracking-[0.3px] whitespace-nowrap max-md:text-[7px]"
                style={{ color: isHighlight ? "#c8a050" : "#585048" }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={0.8} sourceDelay={1.0} />
    </div>
  );
}

// ─── Metric Cards ────────────────────────────────────────────

function MetricCards({ data, annotation, source }: { data: DataPoint[]; annotation?: string; source?: string }) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <div className="grid grid-cols-2 gap-3 max-md:gap-2.5">
        {data.map((d, i) => (
          <motion.div
            key={`${d.label}-${i}`}
            className="flex flex-col gap-1.5 py-4 px-5 rounded-xl max-md:py-3 max-md:px-4"
            style={{
              background: "rgba(200, 160, 60, 0.04)",
              border: "1px solid rgba(200, 160, 60, 0.08)",
            }}
            initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.5, delay: i * 0.1 }}
          >
            <span
              className="text-[11px] tracking-[1px] uppercase max-md:text-[10px]"
              style={{ color: "#807060" }}
            >
              {d.label}
            </span>
            <span
              className="text-[32px] font-light tabular-nums leading-none max-md:text-[24px]"
              style={{ color: "#d4a84a" }}
            >
              {formatValue(d.value, d.unit)}
            </span>
          </motion.div>
        ))}
      </div>

      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={0.6} sourceDelay={0.8} />
    </div>
  );
}

// ─── Line Chart (SVG) ────────────────────────────────────────

function LineChart({ data, annotation, source }: { data: DataPoint[]; annotation?: string; source?: string }) {
  const prefersReduced = useReducedMotion();
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const W = 500;
  const H = 220;
  const PAD_X = 30;
  const PAD_TOP = 32; // extra room for value labels above each dot
  const PAD_BOT = 35;
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_TOP - PAD_BOT;

  const points = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * plotW,
    y: PAD_TOP + plotH - ((d.value - minValue) / range) * plotH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - PAD_BOT} L ${points[0].x} ${H - PAD_BOT} Z`;

  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <motion.path
          d={areaD}
          fill="url(#goldGradient)"
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 1 }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke="rgba(200, 160, 60, 0.7)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={prefersReduced ? {} : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 1.2, ease: "easeOut" }}
        />
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 5 : 3}
              fill={isLast ? "#d4a84a" : "rgba(200, 160, 60, 0.5)"}
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReduced ? { duration: 0 } : { delay: i * 0.06 + 0.3 }}
            />
          );
        })}
        {/* Value labels above each point */}
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          return (
            <motion.text
              key={`value-${i}`}
              x={points[i].x}
              y={points[i].y - 10}
              textAnchor="middle"
              fill={isLast ? "#d4a84a" : "#a09080"}
              fontSize="11"
              fontWeight={isLast ? 500 : 400}
              style={{ fontVariantNumeric: "tabular-nums" }}
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReduced ? { duration: 0 } : { delay: i * 0.06 + 0.6 }}
            >
              {formatValue(d.value, d.unit)}
            </motion.text>
          );
        })}
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={points[i].x}
            y={H - 10}
            textAnchor="middle"
            fill="#585048"
            fontSize="10"
          >
            {d.label}
          </text>
        ))}
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(200, 160, 60, 1)" />
            <stop offset="100%" stopColor="rgba(200, 160, 60, 0)" />
          </linearGradient>
        </defs>
      </svg>

      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={1.0} sourceDelay={1.2} />
    </div>
  );
}

// ─── Donut Chart (SVG) ───────────────────────────────────────

function DonutChart({ data, annotation, source }: { data: DataPoint[]; annotation?: string; source?: string }) {
  const prefersReduced = useReducedMotion();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return null;

  // When the values themselves already represent percentages (e.g. portfolio
  // allocation), hide the duplicate value column and show only the % column.
  const isPercentageData = total >= 99 && total <= 101 && data.every((d) => d.value <= 100);

  const SIZE = 180;
  const CENTER = SIZE / 2;
  const RADIUS = 70;
  const INNER_RADIUS = 45;
  const STROKE = RADIUS - INNER_RADIUS;
  const MID_RADIUS = (RADIUS + INNER_RADIUS) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * MID_RADIUS;

  // Warm brand palette with enough contrast to read on dark background.
  const PALETTE = [
    "#d4a84a", // bright gold
    "#c08a30", // amber
    "#a06a20", // dark amber
    "#8a5018", // bronze
    "#6a4828", // dark bronze
    "#4a3420", // deep brown
  ];

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const offset = -cumulative * CIRCUMFERENCE;
    cumulative += pct;
    return {
      ...d,
      pct,
      dash,
      gap,
      offset,
      color: PALETTE[i % PALETTE.length],
    };
  });

  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <div className="flex items-center gap-6 max-md:gap-3">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={MID_RADIUS}
              fill="none"
              stroke="rgba(200, 160, 60, 0.06)"
              strokeWidth={STROKE}
            />
            {segments.map((seg, i) => (
              <motion.circle
                key={`${seg.label}-${i}`}
                cx={CENTER}
                cy={CENTER}
                r={MID_RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={seg.offset}
                initial={prefersReduced ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  prefersReduced ? { duration: 0 } : { delay: i * 0.08, duration: 0.5 }
                }
              />
            ))}
          </svg>
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] tracking-[1.5px] uppercase max-md:text-[8px]" style={{ color: "#807060" }}>
              Total
            </span>
            <span
              className="text-[20px] font-light tabular-nums leading-none mt-0.5 max-md:text-[18px]"
              style={{ color: "#d4a84a" }}
            >
              {isPercentageData ? "100%" : formatValue(total)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 max-md:gap-1">
          {segments.map((seg, i) => (
            <motion.div
              key={`${seg.label}-${i}`}
              className="flex items-center gap-2 text-[12px] max-md:text-[10px] max-md:gap-1.5"
              initial={prefersReduced ? {} : { opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={
                prefersReduced ? { duration: 0 } : { delay: i * 0.08 + 0.2, duration: 0.4 }
              }
            >
              <span
                className="shrink-0 w-2.5 h-2.5 rounded-sm"
                style={{ background: seg.color }}
              />
              <span style={{ color: "#c8b8a0" }} className="flex-1 truncate">
                {seg.label}
              </span>
              {!isPercentageData && (
                <span
                  className="tabular-nums"
                  style={{ color: "#d4a84a" }}
                >
                  {formatValue(seg.value, seg.unit)}
                </span>
              )}
              <span
                className="tabular-nums text-[11px] max-md:text-[10px] w-10 text-right"
                style={{ color: "#706050" }}
              >
                {Math.round(seg.pct * 100)}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={0.8} sourceDelay={1.0} />
    </div>
  );
}

// ─── Target Price Table ──────────────────────────────────────

function TargetTable({
  targets,
  annotation,
  source,
}: {
  targets: TargetRow[];
  annotation?: string;
  source?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (targets.length === 0) return null;

  // Show only the RANGE of the displayed rows. We deliberately do NOT compute
  // a "consensus" average here, because each table shows a representative
  // subset of analysts (e.g. 5 of 19), so an average of the shown rows would
  // misrepresent the true street consensus. The real documented mean/median
  // belongs in the scene's annotation, authored from the vault.
  const prices = targets.map((t) => t.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const hasRange = low !== high;

  return (
    <div className="flex flex-col gap-6 max-md:gap-2">
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(200, 160, 60, 0.10)" }}
      >
        {/* Header row */}
        <div
          className="grid items-center px-5 py-2.5 text-[10px] tracking-[1px] uppercase max-md:px-4 max-md:py-1.5 max-md:text-[9px]"
          style={{
            gridTemplateColumns: "1fr auto auto",
            gap: "16px",
            color: "#807060",
            background: "rgba(200, 160, 60, 0.05)",
            borderBottom: "1px solid rgba(200, 160, 60, 0.08)",
          }}
        >
          <span>Firm</span>
          <span className="text-right w-20 max-md:w-16">Rating</span>
          <span className="text-right w-16 max-md:w-14">Target</span>
        </div>

        {/* Body rows */}
        {targets.map((t, i) => (
          <motion.div
            key={`${t.firm}-${i}`}
            className="grid items-center px-5 py-3 text-[13px] max-md:px-4 max-md:py-1.5 max-md:text-[12px]"
            style={{
              gridTemplateColumns: "1fr auto auto",
              gap: "16px",
              borderBottom:
                i < targets.length - 1 ? "1px solid rgba(200, 160, 60, 0.05)" : "none",
              background: t.highlight ? "rgba(200, 160, 60, 0.04)" : "transparent",
            }}
            initial={prefersReduced ? {} : { opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReduced ? { duration: 0 } : { delay: i * 0.08 + 0.2, duration: 0.4 }}
          >
            <div className="flex flex-col min-w-0">
              <span className="truncate" style={{ color: "#c8b8a0" }}>
                {t.firm}
              </span>
              {t.date && (
                <span className="text-[10px] max-md:text-[9px]" style={{ color: "#585048" }}>
                  {t.date}
                </span>
              )}
            </div>
            <span
              className="text-right w-20 truncate text-[11px] max-md:w-16 max-md:text-[10px]"
              style={{ color: "#807060" }}
            >
              {t.rating ?? "—"}
            </span>
            <span
              className="text-right w-16 tabular-nums max-md:w-14"
              style={{
                color: t.highlight ? "#d4a84a" : "#c8a050",
                fontWeight: t.highlight ? 600 : 500,
              }}
            >
              ${formatNumber(t.price)}
            </span>
          </motion.div>
        ))}

        {/* Range footer row — shows the spread of the displayed targets. */}
        {hasRange && (
          <motion.div
            className="grid items-center px-5 py-2.5 text-[12px] max-md:px-4 max-md:py-1.5 max-md:text-[11px]"
            style={{
              gridTemplateColumns: "1fr auto",
              gap: "16px",
              background: "rgba(200, 160, 60, 0.05)",
              borderTop: "1px solid rgba(200, 160, 60, 0.08)",
            }}
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReduced ? { duration: 0 } : { delay: targets.length * 0.08 + 0.3 }}
          >
            <span className="tracking-[0.5px]" style={{ color: "#807060" }}>
              Range
            </span>
            <span className="tabular-nums" style={{ color: "#d4a84a", fontWeight: 600 }}>
              ${formatNumber(low)} – ${formatNumber(high)}
            </span>
          </motion.div>
        )}
      </div>

      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={targets.length * 0.08 + 0.5} sourceDelay={targets.length * 0.08 + 0.7} />
    </div>
  );
}

// ─── Shared Footer ──────────────────────────────────────────

function Footer({
  annotation,
  source,
  prefersReduced,
  annotationDelay,
  sourceDelay,
}: {
  annotation?: string;
  source?: string;
  prefersReduced: boolean | null;
  annotationDelay: number;
  sourceDelay: number;
}) {
  if (!annotation && !source) return null;
  return (
    <div className="flex flex-col gap-2 max-md:gap-1">
      {annotation && (
        <motion.p
          className="text-[13px] leading-[1.5] tracking-[0.2px] max-md:text-[12px]"
          style={{ color: "#a09080" }}
          initial={prefersReduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReduced ? { duration: 0 } : { delay: annotationDelay, duration: 0.5 }}
        >
          {annotation}
        </motion.p>
      )}
      {source && (
        <motion.p
          className="text-[10px] tracking-[0.5px] max-md:text-[9px]"
          style={{ color: "#585048" }}
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReduced ? { duration: 0 } : { delay: sourceDelay }}
        >
          Source: {source}
        </motion.p>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatValue(value: number, unit?: string): string {
  // Unit-aware formatting — bakes the unit into the value so labels stay clean
  // ("$1.07B" instead of "1067" + label "Revenue ($M)").
  if (unit) {
    switch (unit) {
      case "$M": {
        // Value is in millions of dollars. Auto-compact to billions when >=1000.
        if (Math.abs(value) >= 1000) {
          return `$${(value / 1000).toFixed(2)}B`;
        }
        return `$${formatNumber(value)}M`;
      }
      case "$B":
        return `$${formatNumber(value)}B`;
      case "$K":
        return `$${formatNumber(value)}K`;
      case "$":
        // Raw dollars: compact to B/M if huge, otherwise group with commas.
        if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
        if (Math.abs(value) >= 1000) return `$${value.toLocaleString("en-US")}`;
        return `$${formatNumber(value)}`;
      case "%": {
        // Accept both ratio (0.50) and percentage (50) input.
        const pct = value > 0 && value < 1 ? value * 100 : value;
        return `${formatNumber(pct)}%`;
      }
      case "M":
        return `${formatNumber(value)}M`;
      case "K":
        return `${formatNumber(value)}K`;
      case "B":
        return `${formatNumber(value)}B`;
      case "x":
        return `${formatNumber(value)}x`;
      case "GW":
      case "MW":
      case "PB":
      case "TB":
      case "m":
      case "mi":
      case "K mi":
        return `${formatNumber(value)} ${unit}`;
      default:
        return `${formatNumber(value)} ${unit}`;
    }
  }

  // Legacy auto-detection (when no unit is provided).
  if (value > 0 && value < 1) return `${(value * 100).toFixed(0)}%`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `${formatNumber(value)}`;
}

function formatNumber(value: number): string {
  // Strip trailing zeros but keep up to 2 decimals when needed.
  // Integers stay clean; fractional values show as needed.
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ─── Thesis Card ─────────────────────────────────────────────
// Bullet list of the 3-4 thesis pillars distilled from the vault. Each pillar
// gets a small gold marker; text is bright on dark. The card is intentionally
// dense in content but visually quiet — the story is in the words.

function ThesisCard({
  pillars,
  annotation,
  source,
}: {
  pillars: { text: string }[];
  annotation?: string;
  source?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (pillars.length === 0) return null;
  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <div
        className="flex flex-col rounded-xl overflow-hidden p-5 max-md:p-3.5 gap-3 max-md:gap-2"
        style={{
          border: "1px solid rgba(200, 160, 60, 0.18)",
          background: "rgba(200, 160, 60, 0.04)",
        }}
      >
        {pillars.map((p, i) => (
          <motion.div
            key={`${i}-${p.text.slice(0, 12)}`}
            className="flex items-start gap-3 max-md:gap-2.5"
            initial={prefersReduced ? {} : { opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReduced ? { duration: 0 } : { delay: i * 0.08 + 0.15, duration: 0.4 }}
          >
            <span
              aria-hidden
              className="shrink-0 mt-[6px] max-md:mt-[5px] w-1.5 h-1.5 rounded-full"
              style={{ background: "#c8a050" }}
            />
            <span
              className="text-[14px] leading-[1.45] max-md:text-[13px] max-md:leading-[1.4]"
              style={{ color: "#d4c4a0" }}
            >
              {p.text}
            </span>
          </motion.div>
        ))}
      </div>
      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={pillars.length * 0.08 + 0.3} sourceDelay={pillars.length * 0.08 + 0.5} />
    </div>
  );
}

// ─── Risks Card ──────────────────────────────────────────────
// Same density as Thesis but with a warning aesthetic: ⚠ marker, deeper amber
// tone. Communicates "I'm not pumping this — here's what would change my mind."
// Each item is title + 1-line detail.

function RisksCard({
  risks,
  annotation,
  source,
}: {
  risks: { title: string; body: string }[];
  annotation?: string;
  source?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (risks.length === 0) return null;
  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          border: "1px solid rgba(200, 110, 70, 0.18)",
          background: "rgba(200, 110, 70, 0.04)",
        }}
      >
        {risks.map((r, i) => (
          <motion.div
            key={`${i}-${r.title.slice(0, 12)}`}
            className="flex items-start gap-3 px-5 py-3 max-md:px-3.5 max-md:py-2"
            style={{
              borderBottom: i < risks.length - 1 ? "1px solid rgba(200, 110, 70, 0.08)" : "none",
            }}
            initial={prefersReduced ? {} : { opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReduced ? { duration: 0 } : { delay: i * 0.08 + 0.15, duration: 0.4 }}
          >
            <span
              aria-hidden
              className="shrink-0 text-[11px] mt-[3px] tabular-nums"
              style={{ color: "#c87a5a" }}
            >
              ⚠
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <span
                className="text-[13px] font-medium leading-[1.3] max-md:text-[12px]"
                style={{ color: "#d4a890" }}
              >
                {r.title}
              </span>
              <span
                className="text-[12px] leading-[1.4] max-md:text-[11px]"
                style={{ color: "#a89080" }}
              >
                {r.body}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={risks.length * 0.08 + 0.3} sourceDelay={risks.length * 0.08 + 0.5} />
    </div>
  );
}

// ─── Catalysts Timeline ──────────────────────────────────────
// Vertical timeline. "done" rows are dim with a check; "upcoming" rows are
// gold with a pending dot. A thin vertical rail connects the dots so it reads
// as a sequence, not a list. Date is shown as-is (vault uses freeform like
// "Jun 4 2026", "Q2 2026", "2027").

function CatalystsTimeline({
  timeline,
  annotation,
  source,
}: {
  timeline: { date: string; text: string; status: "done" | "upcoming" }[];
  annotation?: string;
  source?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (timeline.length === 0) return null;
  return (
    <div className="flex flex-col gap-6 max-md:gap-3">
      <div
        className="relative flex flex-col rounded-xl overflow-hidden p-5 max-md:p-3.5"
        style={{
          border: "1px solid rgba(200, 160, 60, 0.18)",
          background: "rgba(200, 160, 60, 0.04)",
        }}
      >
        {/* The rail. Left-positioned so all dots line up; height covers all
            rows. pl on each row keeps text clear of the rail. */}
        <div
          aria-hidden
          className="absolute top-5 bottom-5 max-md:top-4 max-md:bottom-4 left-[26px] max-md:left-[22px] w-px"
          style={{ background: "rgba(200, 160, 60, 0.15)" }}
        />
        {timeline.map((t, i) => {
          const done = t.status === "done";
          return (
            <motion.div
              key={`${i}-${t.text.slice(0, 12)}`}
              className="flex items-start gap-3 max-md:gap-2.5 py-2 max-md:py-1.5 relative pl-1"
              initial={prefersReduced ? {} : { opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReduced ? { duration: 0 } : { delay: i * 0.07 + 0.15, duration: 0.4 }}
            >
              <span
                aria-hidden
                className="relative z-10 shrink-0 mt-[4px] w-3 h-3 rounded-full flex items-center justify-center"
                style={{
                  background: done ? "#0c0c0c" : "rgba(200, 160, 60, 0.95)",
                  border: done
                    ? "1px solid rgba(200, 160, 60, 0.35)"
                    : "1px solid rgba(200, 160, 60, 0.95)",
                  boxShadow: done ? "none" : "0 0 10px -2px rgba(200, 160, 60, 0.5)",
                }}
              >
                {done && (
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12.5 10 17.5 19 7" stroke="rgba(200, 160, 60, 0.55)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-[10px] tracking-[0.12em] uppercase font-medium"
                  style={{ color: done ? "#706050" : "rgba(212, 168, 74, 0.85)" }}
                >
                  {t.date}
                </span>
                <span
                  className="text-[13px] leading-[1.4] max-md:text-[12px]"
                  style={{ color: done ? "#807060" : "#d4c4a0" }}
                >
                  {t.text}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <Footer annotation={annotation} source={source} prefersReduced={prefersReduced} annotationDelay={timeline.length * 0.07 + 0.3} sourceDelay={timeline.length * 0.07 + 0.5} />
    </div>
  );
}
