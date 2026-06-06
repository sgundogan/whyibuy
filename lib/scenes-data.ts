import type { SceneData } from "@/hooks/useVoiceBrain";

/**
 * Scene Registry — pre-authored visual scenes triggered by the ElevenLabs agent.
 *
 * The AI calls `show_scene({ scene_id: "TICKER_TOPIC" })` and the client looks up
 * the matching scene here. All numbers come from Serkan's Obsidian research vault
 * (~/Documents/Obsidian Vault/Tech Investing/wiki/stocks/) so the data is accurate
 * and the AI cannot hallucinate numbers.
 *
 * Scene_id convention: TICKER_TOPIC (e.g. PLTR_revenue, HOOD_metrics)
 *
 * Chart types:
 * - bar    — time series comparison (quarterly revenue, growth metrics)
 * - line   — trend over time (subscriber growth, stock price, assets)
 * - metric — KPI snapshot (key financial metrics, 2-4 numbers)
 * - donut  — composition / share of total (revenue mix, segment breakdown)
 */
export const SCENE_REGISTRY: Record<string, SceneData> = {
  // ─── Portfolio ───────────────────────────────────────────────

  PORTFOLIO_allocation: {
    chart_type: "donut",
    title: "Portfolio Allocation (5 Positions)",
    data: [
      { label: "Palantir (PLTR)", value: 37 },
      { label: "Robinhood (HOOD)", value: 30 },
      { label: "Aurora (AUR)", value: 17 },
      { label: "Nebius (NBIS)", value: 9 },
      { label: "Tempus (TEM)", value: 7 },
    ],
    annotation: "Concentrated by design: 5 positions, each in a different sector. Best ideas get the most capital.",
  },

  // ─── Palantir ($PLTR) ────────────────────────────────────────

  PLTR_revenue: {
    chart_type: "bar",
    title: "Palantir Quarterly Revenue",
    data: [
      { label: "Q1'25", value: 884, unit: "$M" },
      { label: "Q2'25", value: 1004, unit: "$M" },
      { label: "Q3'25", value: 1181, unit: "$M" },
      { label: "Q4'25", value: 1407, unit: "$M" },
      { label: "Q1'26", value: 1633, unit: "$M", highlight: true },
    ],
    annotation: "Q1'26: $1.633B revenue (+85% YoY) — highest growth rate as a public company. US revenue +104% YoY.",
    source: "Q1 2026 earnings report",
  },

  PLTR_metrics: {
    chart_type: "metric",
    title: "Palantir Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 1633, unit: "$M" },
      { label: "Adj. FCF Margin", value: 0.57, unit: "%" },
      { label: "Rule of 40", value: 145, unit: "%" },
      { label: "Net Dollar Retention", value: 150, unit: "%" },
    ],
    annotation: "Rule of 40 hit 145% — highest among all large-cap companies globally. NDR +1,100bps QoQ to 150%.",
    source: "Q1 2026 earnings report",
  },

  PLTR_stock: {
    chart_type: "line",
    title: "Palantir Share Price (12 months)",
    data: [
      { label: "Jun'24", value: 24, unit: "$" },
      { label: "Aug'24", value: 30, unit: "$" },
      { label: "Oct'24", value: 43, unit: "$" },
      { label: "Dec'24", value: 75, unit: "$" },
      { label: "Feb'25", value: 95, unit: "$" },
      { label: "Apr'25", value: 110, unit: "$" },
      { label: "Jun'25", value: 125, unit: "$" },
    ],
    annotation: "5x in 12 months. Market is pricing in the AIP commercial traction.",
  },

  PLTR_revenue_mix: {
    chart_type: "donut",
    title: "Palantir Revenue Mix (Q1 2026)",
    data: [
      { label: "US Commercial", value: 595, unit: "$M" },
      { label: "US Government", value: 687, unit: "$M" },
      { label: "Int'l Commercial", value: 179, unit: "$M" },
      { label: "Int'l Government", value: 172, unit: "$M" },
    ],
    annotation: "US Commercial revenue +133% YoY — AIP is the engine. US Government still 42% of total but growing 84%.",
    source: "Q1 2026 earnings report",
  },

  // PLTR_moat removed — moat is qualitative; AI explains verbally rather than
  // showing made-up scoring numbers that look authoritative but aren't real.

  // ─── Robinhood ($HOOD) ───────────────────────────────────────

  HOOD_revenue: {
    chart_type: "bar",
    title: "Robinhood Quarterly Revenue",
    data: [
      { label: "Q1'25", value: 927, unit: "$M" },
      { label: "Q2'25", value: 989, unit: "$M" },
      { label: "Q3'25", value: 1274, unit: "$M" },
      { label: "Q4'25", value: 1283, unit: "$M" },
      { label: "Q1'26", value: 1067, unit: "$M", highlight: true },
    ],
    annotation: "FY2025: $4.47B revenue (+52% YoY). Q1'26 +15% YoY despite tough crypto/election comp.",
    source: "Q1 2026 earnings",
  },

  HOOD_metrics: {
    chart_type: "metric",
    title: "Robinhood Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 1067, unit: "$M" },
      { label: "Adj. EBITDA Margin", value: 0.5, unit: "%" },
      { label: "LTM Rule of 40", value: 112, unit: "%" },
      { label: "Diluted EPS", value: 0.38, unit: "$" },
    ],
    annotation: "LTM Adj. EBITDA hit a record $2.6B at 56% margin. Rule of 40 at 112% LTM.",
    source: "Q1 2026 earnings presentation",
  },

  HOOD_gold: {
    chart_type: "line",
    title: "Robinhood Gold Subscribers",
    data: [
      { label: "Q1'25", value: 3.19, unit: "M" },
      { label: "Q2'25", value: 3.48, unit: "M" },
      { label: "Q3'25", value: 3.88, unit: "M" },
      { label: "Q4'25", value: 4.18, unit: "M" },
      { label: "Q1'26", value: 4.34, unit: "M" },
    ],
    annotation: "Gold hit 4.34M subscribers (+36% YoY, 15.8% adoption). The retention flywheel keeps compounding.",
    source: "Q1 2026 earnings",
  },

  HOOD_assets: {
    chart_type: "line",
    title: "Robinhood Platform Assets",
    data: [
      { label: "Q1'25", value: 221, unit: "$B" },
      { label: "Q2'25", value: 279, unit: "$B" },
      { label: "Q3'25", value: 333, unit: "$B" },
      { label: "Q4'25", value: 322, unit: "$B" },
      { label: "Q1'26", value: 307, unit: "$B" },
    ],
    annotation: "$307B in platform assets (+39% YoY). $67.8B in LTM net deposits — wallet share winning.",
    source: "Q1 2026 earnings",
  },

  HOOD_revenue_mix: {
    chart_type: "donut",
    title: "Robinhood Revenue Mix (Q1 2026)",
    data: [
      { label: "Options", value: 260, unit: "$M" },
      { label: "Crypto", value: 134, unit: "$M" },
      { label: "Event Contracts", value: 147, unit: "$M" },
      { label: "Equity", value: 94, unit: "$M" },
      { label: "Net Interest", value: 359, unit: "$M" },
      { label: "Other", value: 85, unit: "$M" },
    ],
    annotation: "Net Interest is now the single largest line at $359M (+24% YoY). Event Contracts annualizing at ~$415M.",
    source: "Q1 2026 earnings",
  },

  HOOD_prediction: {
    chart_type: "bar",
    title: "Robinhood Event Contracts (B traded)",
    data: [
      { label: "Q3'25", value: 2.3 },
      { label: "Q4'25", value: 2.9 },
      { label: "Q1'26", value: 3.4, highlight: true },
    ],
    annotation: "Prediction markets at $415M annualized — the fastest $100M ARR business in HOOD history.",
    source: "Q1 2026 earnings",
  },

  // ─── Aurora Innovation ($AUR) ────────────────────────────────

  AUR_revenue: {
    chart_type: "bar",
    title: "Aurora Quarterly Revenue ($M)",
    data: [
      { label: "Q1'25", value: 0 },
      { label: "Q2'25", value: 1 },
      { label: "Q3'25", value: 1 },
      { label: "Q4'25", value: 1 },
      { label: "Q1'26", value: 1, highlight: true },
    ],
    annotation: "FY2025: $3M (first revenue). 2026 guide: $14-16M (+400% YoY). Exit run-rate target: $80M.",
    source: "Q1 2026 earnings",
  },

  AUR_miles: {
    chart_type: "line",
    title: "Aurora Cumulative Driverless Miles",
    data: [
      { label: "Apr'25", value: 4, unit: "K" },
      { label: "Jun'25", value: 20, unit: "K" },
      { label: "Oct'25", value: 100, unit: "K" },
      { label: "Jan'26", value: 250, unit: "K" },
      { label: "Apr'26", value: 370, unit: "K" },
    ],
    annotation: "Zero to 370K driverless miles in 12 months. Zero Aurora-attributed collisions. 100% on-time.",
    source: "Q1 2026 earnings",
  },

  AUR_metrics: {
    chart_type: "metric",
    title: "Aurora Operational Snapshot (Q1 2026)",
    data: [
      { label: "Driverless Routes", value: 12 },
      { label: "Driverless Customers", value: 7 },
      { label: "Driverless Miles", value: 370, unit: "K" },
      { label: "On-Time Performance", value: 100, unit: "%" },
    ],
    annotation: "12-route driverless network with McLane (Berkshire) joining Q1'26. California approved AV trucking — SAM expanding to 60B VMT by 2028.",
    source: "Q1 2026 earnings",
  },

  AUR_economics: {
    chart_type: "metric",
    title: "Carrier Economics — FW to Phoenix (1 week)",
    data: [
      { label: "Trips/Week (Human)", value: 3 },
      { label: "Trips/Week (Aurora)", value: 8 },
      { label: "Profit/Week (Human)", value: 185, unit: "$" },
      { label: "Profit/Week (Aurora)", value: 1695, unit: "$" },
    ],
    annotation: "Aurora Driver delivers +816% profit/truck/week vs. human driving. Night + weather + no HoS limits = utilization unlocks.",
    source: "Aurora carrier economics, Q1 2026 illustrative",
  },

  AUR_hardware: {
    chart_type: "metric",
    title: "Aurora Hardware Generation Progression",
    data: [
      { label: "Gen 1 Range", value: 450, unit: "m" },
      { label: "Gen 2 Range", value: 1000, unit: "m" },
      { label: "Gen 1 Lifecycle", value: 300, unit: "K mi" },
      { label: "Gen 2 Lifecycle", value: 1000, unit: "K mi" },
    ],
    annotation: "Gen 2: 2x range, 3.3x lifecycle, 50%+ cost reduction. 34s planning horizon at highway speed.",
    source: "Aurora Q1 2026 hardware specs",
  },

  // ─── Nebius Group ($NBIS) ────────────────────────────────────

  NBIS_revenue: {
    chart_type: "bar",
    title: "Nebius Group Revenue",
    data: [
      { label: "Q1'25", value: 55, unit: "$M" },
      { label: "Q2'25", value: 105, unit: "$M" },
      { label: "Q3'25", value: 146, unit: "$M" },
      { label: "Q4'25", value: 228, unit: "$M" },
      { label: "Q1'26", value: 399, unit: "$M", highlight: true },
    ],
    annotation: "Q1'26: $399M revenue (+684% YoY, +75% QoQ). 2026 guide: $3B-$3.4B — 6x FY2025.",
    source: "Q1 2026 shareholder letter",
  },

  NBIS_arr: {
    chart_type: "line",
    title: "Nebius AI Cloud ARR",
    data: [
      { label: "Mar'25", value: 249, unit: "$M" },
      { label: "Jun'25", value: 430, unit: "$M" },
      { label: "Sep'25", value: 551, unit: "$M" },
      { label: "Dec'25", value: 1250, unit: "$M" },
      { label: "Mar'26", value: 1920, unit: "$M" },
    ],
    annotation: "ARR grew 7.7x in 12 months. 2026 exit target: $7B-$9B with >50% already contracted.",
    source: "Q1 2026 shareholder letter",
  },

  NBIS_metrics: {
    chart_type: "metric",
    title: "Nebius Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 399, unit: "$M" },
      { label: "Adj. EBITDA Margin", value: 0.32, unit: "%" },
      { label: "Cash on Hand", value: 9.3, unit: "$B" },
      { label: "Contracted Power", value: 3.5, unit: "GW" },
    ],
    annotation: "First profitable quarter at scale. $2.3B operating cash flow Q1'26 (Microsoft + Meta prepayments).",
    source: "Q1 2026 shareholder letter",
  },

  NBIS_capex: {
    chart_type: "bar",
    title: "Nebius Quarterly CapEx",
    data: [
      { label: "Q1'25", value: 544, unit: "$M" },
      { label: "Q2'25", value: 511, unit: "$M" },
      { label: "Q3'25", value: 956, unit: "$M" },
      { label: "Q4'25", value: 2100, unit: "$M" },
      { label: "Q1'26", value: 2500, unit: "$M", highlight: true },
    ],
    annotation: "2026 CapEx raised to $20-25B (from $16-20B). Staged model: land/power first (1%), data centers (20%), GPUs (80%) only against visible demand.",
    source: "Q1 2026 shareholder letter",
  },

  NBIS_deals: {
    chart_type: "metric",
    title: "Nebius Mega Deal Commitments",
    data: [
      { label: "Microsoft", value: 17, unit: "$B" },
      { label: "Meta (5yr)", value: 27, unit: "$B" },
      { label: "NVIDIA Equity", value: 2, unit: "$B" },
      { label: "ClickHouse Stake", value: 15, unit: "$B" },
    ],
    annotation: "Anchor customers prepay capacity → funds ~60% of 2026 CapEx. ClickHouse 25% stake = hidden optionality.",
    source: "Q1 2026 shareholder letter",
  },

  // ─── Tempus AI ($TEM) ────────────────────────────────────────

  TEM_revenue: {
    chart_type: "bar",
    title: "Tempus Quarterly Revenue",
    data: [
      { label: "Q1'25", value: 256, unit: "$M" },
      { label: "Q2'25", value: 315, unit: "$M" },
      { label: "Q3'25", value: 334, unit: "$M" },
      { label: "Q4'25", value: 367, unit: "$M" },
      { label: "Q1'26", value: 348, unit: "$M", highlight: true },
    ],
    annotation: "FY2025: $1.27B (+83% YoY). 2026 guide: $1.59-1.60B revenue + ~$65M Adj. EBITDA — first profitable year.",
    source: "Q1 2026 earnings",
  },

  TEM_segments: {
    chart_type: "donut",
    title: "Tempus Revenue Mix (Q1 2026)",
    data: [
      { label: "Oncology Dx", value: 147, unit: "$M" },
      { label: "Hereditary Dx", value: 100, unit: "$M" },
      { label: "Other Dx", value: 14, unit: "$M" },
      { label: "Data & Applications", value: 87, unit: "$M" },
    ],
    annotation: "Diagnostics generates the data; Data & Applications monetizes it at ~73% gross margins with 126% NRR.",
    source: "Q1 2026 earnings",
  },

  TEM_metrics: {
    chart_type: "metric",
    title: "Tempus Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 348, unit: "$M" },
      { label: "Non-GAAP Gross Margin", value: 0.65, unit: "%" },
      { label: "Net Revenue Retention", value: 126, unit: "%" },
      { label: "Total Contract Value", value: 1.1, unit: "$B" },
    ],
    annotation: "TCV grew Q1'26 despite delivering $80M+ revenue — backlog increasing. Path to first profitable year.",
    source: "Q1 2026 earnings",
  },

  TEM_data_moat: {
    chart_type: "metric",
    title: "Tempus Data Flywheel (Q1 2026)",
    data: [
      { label: "Data", value: 500, unit: "PB" },
      { label: "Connected Providers", value: 9000 },
      { label: "Patient Records", value: 45, unit: "M" },
      { label: "Samples Sequenced", value: 3, unit: "M" },
    ],
    annotation: "500+ PB of multimodal data + 9,000 providers. 19 of top 20 biopharma on Lens platform.",
    source: "Q1 2026 earnings",
  },

  TEM_pharma: {
    chart_type: "metric",
    title: "Tempus Strategic Pharma Deals",
    data: [
      { label: "AstraZeneca (3yr)", value: 200, unit: "$M" },
      { label: "Merck (comparable)", value: 100, unit: "$M" },
      { label: "Strategic Partners $100M+", value: 6 },
      { label: "Top 20 Biopharma on Lens", value: 19 },
    ],
    annotation: "$200M AZ foundation model deal: first proof. Merck, BMS, Gilead, Daiichi Sankyo, GSK now joined.",
    source: "Q1 2026 + partnership announcements",
  },
};
