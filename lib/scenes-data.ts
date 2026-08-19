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
 * - bar     — time series comparison (quarterly revenue, growth metrics)
 * - line    — trend over time (subscriber growth, stock price, assets)
 * - metric  — KPI snapshot (key financial metrics, 2-4 numbers)
 * - donut   — composition / share of total (revenue mix, segment breakdown)
 * - targets — analyst price-target table (banks/research firms, NOT Serkan's view)
 */
export const SCENE_REGISTRY: Record<string, SceneData> = {
  // ─── Market Health (live, wide-angle view) ───────────────────
  //
  // Live-data scene. The placeholder metrics below get REPLACED at render
  // time by hydrateEarningsScene() in useVoiceBrain.ts, which reads the
  // weekly FactSet snapshot from /api/earnings/current. The values here
  // are only shown if the fetch fails — a graceful degradation, not the
  // real data. Cron writer: /api/cron/earnings-tally.
  //
  // Deliberately off the 5-ticker deep-dive path — surfaces only when the
  // user asks the wide-angle question ("piyasa nasıl?", "earnings season
  // nasıl geçiyor?"). Frames aggregate strength as anti-panic evidence.

  EARNINGS_current: {
    chart_type: "metric",
    title: "S&P 500 Earnings Season",
    data: [
      { label: "Rapor eden", value: 0, unit: "%" },
      { label: "EPS beklentiyi aştı", value: 0, unit: "%" },
      { label: "Gelir beklentiyi aştı", value: 0, unit: "%" },
    ],
    annotation: "Yükleniyor…",
    source: "FactSet Earnings Insight",
    followups: [
      { text: "Bu oran neden önemli?", lang: "tr" },
      { text: "Geçen çeyrek ne kadardı?", lang: "tr" },
      { text: "Piyasa çöküyor mu?", lang: "tr" },
      { text: "Why does this matter?", lang: "en" },
      { text: "How did last quarter compare?", lang: "en" },
      { text: "Is the market falling apart?", lang: "en" },
    ],
  },

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
    followups: [
      { text: "Neden Palantir en büyük pozisyon?", lang: "tr" },
      { text: "Neden sadece 5 pozisyon?", lang: "tr" },
      { text: "Ne zaman pozisyon eklersin?", lang: "tr" },
      { text: "Why is Palantir the biggest position?", lang: "en" },
      { text: "Why only 5 positions?", lang: "en" },
      { text: "When do you add to a position?", lang: "en" },
    ],
  },

  // ─── Palantir ($PLTR) ────────────────────────────────────────

  PLTR_revenue: {
    chart_type: "bar",
    title: "Palantir Quarterly Revenue",
    data: [
      { label: "Q2'25", value: 1004, unit: "$M" },
      { label: "Q3'25", value: 1181, unit: "$M" },
      { label: "Q4'25", value: 1407, unit: "$M" },
      { label: "Q1'26", value: 1633, unit: "$M" },
      { label: "Q2'26", value: 1935, unit: "$M", highlight: true },
    ],
    annotation: "Q2'26: $1.935B revenue (+93% YoY) — highest growth rate ever. US commercial +149% YoY.",
    source: "Q2 2026 earnings report",
    followups: [
      { text: "Bu büyüme sürdürülebilir mi?", lang: "tr" },
      { text: "Büyüme nereden geliyor?", lang: "tr" },
      { text: "Anahtar metrikler neler?", lang: "tr" },
      { text: "Is this growth sustainable?", lang: "en" },
      { text: "Where is growth coming from?", lang: "en" },
      { text: "What are the key metrics?", lang: "en" },
    ],
  },

  PLTR_metrics: {
    chart_type: "metric",
    title: "Palantir Key Metrics (Q2 2026)",
    data: [
      { label: "Revenue", value: 1935, unit: "$M" },
      { label: "Adj. FCF Margin", value: 0.63, unit: "%" },
      { label: "Rule of 40", value: 155, unit: "%" },
      { label: "Net Dollar Retention", value: 157, unit: "%" },
    ],
    annotation: "Rule of 40 hit 155% — 12th straight quarter of expansion. NDR +700bps QoQ to 157%. GAAP net income >$1B.",
    source: "Q2 2026 earnings report",
    followups: [
      { text: "Rule of 40 ne anlama geliyor?", lang: "tr" },
      { text: "AIP nedir, neden önemli?", lang: "tr" },
      { text: "Palantir'i ne zaman satarsın?", lang: "tr" },
      { text: "What does Rule of 40 mean?", lang: "en" },
      { text: "What is AIP and why does it matter?", lang: "en" },
      { text: "When would you sell Palantir?", lang: "en" },
    ],
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
    followups: [
      { text: "Bu fiyat seviyesinden alır mıydın?", lang: "tr" },
      { text: "Palantir aşırı pahalı mı?", lang: "tr" },
      { text: "Anahtar metriklere bakalım.", lang: "tr" },
      { text: "Would you buy at this price?", lang: "en" },
      { text: "Is Palantir overvalued?", lang: "en" },
      { text: "Show me the key metrics", lang: "en" },
    ],
  },

  PLTR_revenue_mix: {
    chart_type: "donut",
    title: "Palantir Revenue Mix (Q2 2026)",
    data: [
      { label: "US Commercial", value: 764, unit: "$M" },
      { label: "US Government", value: 809, unit: "$M" },
      { label: "Int'l Commercial", value: 182, unit: "$M" },
      { label: "Int'l Government", value: 181, unit: "$M" },
    ],
    annotation: "US Commercial revenue +149% YoY — AIP is the engine. US Commercial TCV hit $2.132B (+153%, a record).",
    source: "Q2 2026 earnings report",
    followups: [
      { text: "AIP nedir, neden önemli?", lang: "tr" },
      { text: "ABD ticari neden bu kadar hızlı büyüyor?", lang: "tr" },
      { text: "Uluslararası büyüme ne durumda?", lang: "tr" },
      { text: "What is AIP and why does it matter?", lang: "en" },
      { text: "Why is US Commercial growing this fast?", lang: "en" },
      { text: "How is international growth doing?", lang: "en" },
    ],
  },

  // PLTR_moat removed — moat is qualitative; AI explains verbally rather than
  // showing made-up scoring numbers that look authoritative but aren't real.

  // ─── Robinhood ($HOOD) ───────────────────────────────────────

  HOOD_revenue: {
    chart_type: "bar",
    title: "Robinhood Quarterly Revenue",
    data: [
      { label: "Q2'25", value: 989, unit: "$M" },
      { label: "Q3'25", value: 1274, unit: "$M" },
      { label: "Q4'25", value: 1283, unit: "$M" },
      { label: "Q1'26", value: 1067, unit: "$M" },
      { label: "Q2'26", value: 1308, unit: "$M", highlight: true },
    ],
    annotation: "Record $1.308B revenue (+32% YoY, +23% QoQ). LTM revenue $4.9B.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Gelir dağılımını göster.", lang: "tr" },
      { text: "Kripto ne kadar gelir getiriyor?", lang: "tr" },
      { text: "Gold'un katkısı nedir?", lang: "tr" },
      { text: "Show me the revenue mix", lang: "en" },
      { text: "How much comes from crypto?", lang: "en" },
      { text: "How much does Gold contribute?", lang: "en" },
    ],
  },

  HOOD_metrics: {
    chart_type: "metric",
    title: "Robinhood Key Metrics (Q2 2026)",
    data: [
      { label: "Revenue", value: 1308, unit: "$M" },
      { label: "Adj. EBITDA Margin", value: 0.57, unit: "%" },
      { label: "LTM Rule of 40", value: 113, unit: "%" },
      { label: "Diluted EPS", value: 0.62, unit: "$" },
    ],
    annotation: "Record $741M quarterly Adj. EBITDA (57% margin). LTM Adj. EBITDA $2.8B. Rule of 40 at 113% LTM.",
    source: "Q2 2026 earnings presentation",
    followups: [
      { text: "Gold büyümesini göster.", lang: "tr" },
      { text: "Robinhood'un Coinbase karşısındaki konumu nedir?", lang: "tr" },
      { text: "Robinhood'u ne zaman satarsın?", lang: "tr" },
      { text: "Show me Gold growth", lang: "en" },
      { text: "How does Robinhood compare to Coinbase?", lang: "en" },
      { text: "When would you sell Robinhood?", lang: "en" },
    ],
  },

  HOOD_gold: {
    chart_type: "line",
    title: "Robinhood Gold Subscribers",
    data: [
      { label: "Q2'25", value: 3.48, unit: "M" },
      { label: "Q3'25", value: 3.88, unit: "M" },
      { label: "Q4'25", value: 4.18, unit: "M" },
      { label: "Q1'26", value: 4.34, unit: "M" },
      { label: "Q2'26", value: 4.84, unit: "M" },
    ],
    annotation: "Gold hit 4.84M subscribers (+1.4M YoY, 17% adoption). The retention flywheel keeps compounding.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Gold Card kullanıcı sayısı kaç?", lang: "tr" },
      { text: "Robinhood nasıl para kazanıyor?", lang: "tr" },
      { text: "Üyelik ücreti ne kadar?", lang: "tr" },
      { text: "How many Gold Card users?", lang: "en" },
      { text: "How does Robinhood actually make money?", lang: "en" },
      { text: "What's the subscription fee?", lang: "en" },
    ],
  },

  HOOD_assets: {
    chart_type: "line",
    title: "Robinhood Platform Assets",
    data: [
      { label: "Q2'25", value: 279, unit: "$B" },
      { label: "Q3'25", value: 333, unit: "$B" },
      { label: "Q4'25", value: 322, unit: "$B" },
      { label: "Q1'26", value: 307, unit: "$B" },
      { label: "Q2'26", value: 369, unit: "$B" },
    ],
    annotation: "$369B in platform assets (+32% YoY). Record $22B net deposits in Q2 ($76B LTM) — wallet share winning.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Net mevduat nereden geliyor?", lang: "tr" },
      { text: "Aktif kullanıcı sayısı nedir?", lang: "tr" },
      { text: "Robinhood'un Schwab karşısındaki avantajı nedir?", lang: "tr" },
      { text: "Where are the net deposits coming from?", lang: "en" },
      { text: "How many active users?", lang: "en" },
      { text: "How does Robinhood compare to Schwab?", lang: "en" },
    ],
  },

  HOOD_revenue_mix: {
    chart_type: "donut",
    title: "Robinhood Revenue Mix (Q2 2026)",
    data: [
      { label: "Options", value: 342, unit: "$M" },
      { label: "Crypto", value: 100, unit: "$M" },
      { label: "Event Contracts", value: 156, unit: "$M" },
      { label: "Equity", value: 129, unit: "$M" },
      { label: "Net Interest", value: 389, unit: "$M" },
      { label: "Other", value: 143, unit: "$M" },
    ],
    annotation: "Net Interest still the single largest line at $389M. Event Contracts now $156M, annualizing at ~$624M.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Event Contracts ne demek?", lang: "tr" },
      { text: "Kripto ne kadar gelir sağlıyor?", lang: "tr" },
      { text: "Faiz gelirinin riski nedir?", lang: "tr" },
      { text: "What are Event Contracts?", lang: "en" },
      { text: "How much from crypto?", lang: "en" },
      { text: "What's the net-interest risk?", lang: "en" },
    ],
  },

  HOOD_prediction: {
    chart_type: "bar",
    title: "Robinhood Event Contracts (B traded)",
    data: [
      { label: "Q3'25", value: 2.3 },
      { label: "Q4'25", value: 2.9 },
      { label: "Q1'26", value: 3.4 },
      { label: "Q2'26", value: 3.4, highlight: true },
    ],
    annotation: "Prediction markets at $624M annualized (record event-contract ADV in June) — fastest $100M ARR business in HOOD history.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Tahmin piyasalarındaki regülasyon riski nedir?", lang: "tr" },
      { text: "California ve NY ne yapacak?", lang: "tr" },
      { text: "Robinhood'un Kalshi karşısındaki konumu nedir?", lang: "tr" },
      { text: "Regulatory risk for prediction markets?", lang: "en" },
      { text: "What about CA / NY?", lang: "en" },
      { text: "How does Robinhood compete with Kalshi?", lang: "en" },
    ],
  },

  // ─── Aurora Innovation ($AUR) ────────────────────────────────

  AUR_revenue: {
    chart_type: "bar",
    title: "Aurora Quarterly Revenue ($M)",
    data: [
      { label: "Q2'25", value: 1 },
      { label: "Q3'25", value: 1 },
      { label: "Q4'25", value: 1 },
      { label: "Q1'26", value: 1 },
      { label: "Q2'26", value: 2, highlight: true },
    ],
    annotation: "FY2025: $3M (first revenue). 2026 guide: $14-16M (+400% YoY), back-end loaded. Exit run-rate target: $80M.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "DaaS modeli nasıl çalışıyor?", lang: "tr" },
      { text: "Toplam driverless mil kaç oldu?", lang: "tr" },
      { text: "Aurora ne zaman kâra geçer?", lang: "tr" },
      { text: "How does the DaaS model work?", lang: "en" },
      { text: "How many driverless miles?", lang: "en" },
      { text: "When does Aurora become profitable?", lang: "en" },
    ],
  },

  AUR_miles: {
    chart_type: "line",
    title: "Aurora Cumulative Driverless Miles",
    data: [
      { label: "Jun'25", value: 20, unit: "K" },
      { label: "Oct'25", value: 100, unit: "K" },
      { label: "Jan'26", value: 250, unit: "K" },
      { label: "Apr'26", value: 370, unit: "K" },
      { label: "Jun'26", value: 440, unit: "K" },
    ],
    annotation: "Nearly 440K cumulative driverless miles through Q2'26. Zero Aurora-attributed collisions. 100% on-time.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Hangi rotalarda çalışıyor?", lang: "tr" },
      { text: "Müşteriler kimler?", lang: "tr" },
      { text: "Kamyon ekonomisini göster.", lang: "tr" },
      { text: "Which routes are live?", lang: "en" },
      { text: "Who are the customers?", lang: "en" },
      { text: "Show me carrier economics", lang: "en" },
    ],
  },

  AUR_metrics: {
    chart_type: "metric",
    title: "Aurora Operational Snapshot (Q2 2026)",
    data: [
      { label: "Driverless Customers", value: 9 },
      { label: "Driverless Miles", value: 440, unit: "K" },
      { label: "On-Time Performance", value: 100, unit: "%" },
      { label: "Aurora-Attrib. Collisions", value: 0 },
    ],
    annotation: "Driverless cohort grew to 9 customers in Q2'26 (added Value Truck + Charger Logistics). Commercial scaling phase — new truck fleet launched.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Rakipleri kimler?", lang: "tr" },
      { text: "Aurora ne zaman kâra geçer?", lang: "tr" },
      { text: "Kamyon ekonomisi nasıl çalışıyor?", lang: "tr" },
      { text: "Who are the competitors?", lang: "en" },
      { text: "When does Aurora become profitable?", lang: "en" },
      { text: "How does truck economics work?", lang: "en" },
    ],
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
    followups: [
      { text: "Bu sayılar neden bu kadar büyük?", lang: "tr" },
      { text: "Hangi taşıyıcılarla anlaştı?", lang: "tr" },
      { text: "Sürücü krizi tezi nedir?", lang: "tr" },
      { text: "Why are these numbers so large?", lang: "en" },
      { text: "Which carriers signed on?", lang: "en" },
      { text: "What's the driver-shortage thesis?", lang: "en" },
    ],
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
    followups: [
      { text: "Gen 2 ne zaman çıkıyor?", lang: "tr" },
      { text: "Sensör maliyeti düşüyor mu?", lang: "tr" },
      { text: "Aurora'nın Tesla FSD'den farkı nedir?", lang: "tr" },
      { text: "When is Gen 2 launching?", lang: "en" },
      { text: "Is sensor cost coming down?", lang: "en" },
      { text: "How does Aurora differ from Tesla FSD?", lang: "en" },
    ],
  },

  // ─── Nebius Group ($NBIS) ────────────────────────────────────

  NBIS_revenue: {
    chart_type: "bar",
    title: "Nebius Group Revenue",
    data: [
      { label: "Q2'25", value: 105, unit: "$M" },
      { label: "Q3'25", value: 146, unit: "$M" },
      { label: "Q4'25", value: 228, unit: "$M" },
      { label: "Q1'26", value: 399, unit: "$M" },
      { label: "Q2'26", value: 582, unit: "$M", highlight: true },
    ],
    annotation: "Q2'26: $582M revenue (+454% YoY, +46% QoQ). 2026 guide: $3B-$3.4B reaffirmed — 6x FY2025.",
    source: "Q2 2026 shareholder letter",
    followups: [
      { text: "Müşterileri kimler?", lang: "tr" },
      { text: "Nebius'un CoreWeave'den farkı nedir?", lang: "tr" },
      { text: "Capex riskleri ne kadar büyük?", lang: "tr" },
      { text: "Who are the customers?", lang: "en" },
      { text: "How is Nebius different from CoreWeave?", lang: "en" },
      { text: "How big are the capex risks?", lang: "en" },
    ],
  },

  NBIS_arr: {
    chart_type: "line",
    title: "Nebius AI Cloud ARR",
    data: [
      { label: "Jun'25", value: 430, unit: "$M" },
      { label: "Sep'25", value: 551, unit: "$M" },
      { label: "Dec'25", value: 1250, unit: "$M" },
      { label: "Mar'26", value: 1920, unit: "$M" },
      { label: "Jun'26", value: 3000, unit: "$M" },
    ],
    annotation: "ARR hit $3.0B (+598% YoY, +56% QoQ). 2026 exit target: $7B-$9B (reaffirmed) with >50% already contracted.",
    source: "Q2 2026 shareholder letter",
    followups: [
      { text: "Sözleşmeli backlog ne kadar?", lang: "tr" },
      { text: "Microsoft anlaşmasını anlat.", lang: "tr" },
      { text: "Müşteri yoğunluğu riski var mı?", lang: "tr" },
      { text: "How much contracted backlog?", lang: "en" },
      { text: "Walk me through the Microsoft deal", lang: "en" },
      { text: "Is there customer concentration risk?", lang: "en" },
    ],
  },

  NBIS_metrics: {
    chart_type: "metric",
    title: "Nebius Key Metrics (Q2 2026)",
    data: [
      { label: "Revenue", value: 582, unit: "$M" },
      { label: "Adj. EBITDA Margin", value: 0.41, unit: "%" },
      { label: "Cash on Hand", value: 8.0, unit: "$B" },
      { label: "Contracted Power", value: 5, unit: "GW" },
    ],
    annotation: "41% Adj. EBITDA margin (up from 32% in Q1). $2.3B operating cash flow; four new $1B+ TCV cloud deals (Reflection, Cohere +2).",
    source: "Q2 2026 shareholder letter",
    followups: [
      { text: "3.5 GW güç nereden geliyor?", lang: "tr" },
      { text: "EBITDA marjı nasıl artıyor?", lang: "tr" },
      { text: "Nakit pozisyonu yeterli mi?", lang: "tr" },
      { text: "Where does the 3.5 GW power come from?", lang: "en" },
      { text: "How is EBITDA margin scaling?", lang: "en" },
      { text: "Is the cash position sufficient?", lang: "en" },
    ],
  },

  NBIS_capex: {
    chart_type: "bar",
    title: "Nebius Quarterly CapEx",
    data: [
      { label: "Q2'25", value: 511, unit: "$M" },
      { label: "Q3'25", value: 956, unit: "$M" },
      { label: "Q4'25", value: 2100, unit: "$M" },
      { label: "Q1'26", value: 2500, unit: "$M" },
      { label: "Q2'26", value: 5700, unit: "$M", highlight: true },
    ],
    annotation: "2026 CapEx guided $20-25B. Staged model: land/power first (1%), data centers (20%), GPUs (80%) only against visible demand; 50-60% self-financed by prepayments.",
    source: "Q2 2026 shareholder letter",
    followups: [
      { text: "Bu kadar capex nasıl finanse ediliyor?", lang: "tr" },
      { text: "Nebius bir AI capex balonu kurbanı olur mu?", lang: "tr" },
      { text: "Nebius'un ROIC'si nedir?", lang: "tr" },
      { text: "How is this much capex financed?", lang: "en" },
      { text: "Is Nebius at risk in an AI capex bubble?", lang: "en" },
      { text: "What's Nebius's ROIC?", lang: "en" },
    ],
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
    annotation: "Anchor prepayments fund 50-60% of 2026 CapEx. Q2'26 added four $1B+ TCV cloud deals (Reflection, Cohere +2). ClickHouse 25% stake = hidden optionality.",
    source: "Q2 2026 shareholder letter",
    followups: [
      { text: "Microsoft anlaşmasının süresi nedir?", lang: "tr" },
      { text: "Meta ne için kullanıyor?", lang: "tr" },
      { text: "ClickHouse hissesi neden önemli?", lang: "tr" },
      { text: "How long is the Microsoft deal?", lang: "en" },
      { text: "What is Meta using it for?", lang: "en" },
      { text: "Why is the ClickHouse stake important?", lang: "en" },
    ],
  },

  // ─── Tempus AI ($TEM) ────────────────────────────────────────

  TEM_revenue: {
    chart_type: "bar",
    title: "Tempus Quarterly Revenue",
    data: [
      { label: "Q2'25", value: 315, unit: "$M" },
      { label: "Q3'25", value: 334, unit: "$M" },
      { label: "Q4'25", value: 367, unit: "$M" },
      { label: "Q1'26", value: 348, unit: "$M" },
      { label: "Q2'26", value: 382, unit: "$M", highlight: true },
    ],
    annotation: "Q2'26: $382.5M (+22% YoY). 2026 guide raised to $1.595-1.605B (~25% growth) + ~$65M Adj. EBITDA — first profitable year.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Segment kırılımını göster.", lang: "tr" },
      { text: "Hangi kanal en hızlı büyüyor?", lang: "tr" },
      { text: "Foundation modelleri nedir?", lang: "tr" },
      { text: "Show me the segment breakdown", lang: "en" },
      { text: "Which channel grows fastest?", lang: "en" },
      { text: "What are foundation models?", lang: "en" },
    ],
  },

  TEM_segments: {
    chart_type: "donut",
    title: "Tempus Revenue Mix (Q2 2026)",
    data: [
      { label: "Oncology + Other Dx", value: 182, unit: "$M" },
      { label: "Hereditary Dx", value: 107, unit: "$M" },
      { label: "Data & Applications", value: 93, unit: "$M" },
    ],
    annotation: "Diagnostics $289M (oncology volume +31% YoY); Data & Applications $93M (+28%) monetizes the data at ~71% gross margin.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Oncology Dx neden bu kadar büyük?", lang: "tr" },
      { text: "Data & Apps marjı nasıl bu kadar yüksek?", lang: "tr" },
      { text: "Pharma müşterileri kimler?", lang: "tr" },
      { text: "Why is Oncology Dx so dominant?", lang: "en" },
      { text: "Why are Data & Apps margins so high?", lang: "en" },
      { text: "Who are the pharma customers?", lang: "en" },
    ],
  },

  TEM_metrics: {
    chart_type: "metric",
    title: "Tempus Key Metrics (Q2 2026)",
    data: [
      { label: "Revenue", value: 382, unit: "$M" },
      { label: "Non-GAAP Gross Margin", value: 0.66, unit: "%" },
      { label: "Net Revenue Retention", value: 126, unit: "%" },
      { label: "Total Contract Value", value: 1.1, unit: "$B" },
    ],
    annotation: "$382.5M revenue (+22% YoY); H1'26 Adj. EBITDA turned positive (+$5.2M). ~$200M new Data & Apps bookings signed in Q2.",
    source: "Q2 2026 earnings",
    followups: [
      { text: "Veri moat'ı ne kadar derin?", lang: "tr" },
      { text: "Tempus nasıl para kazanıyor?", lang: "tr" },
      { text: "Pharma anlaşmaları nasıl çalışıyor?", lang: "tr" },
      { text: "How deep is the data moat?", lang: "en" },
      { text: "How does Tempus actually make money?", lang: "en" },
      { text: "How do pharma deals work?", lang: "en" },
    ],
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
    followups: [
      { text: "500 petabayt ne anlama gelir?", lang: "tr" },
      { text: "Veriyi nasıl topluyor?", lang: "tr" },
      { text: "Rakipleri bu veriyi yakalayabilir mi?", lang: "tr" },
      { text: "What does 500 PB mean in context?", lang: "en" },
      { text: "How does Tempus collect this data?", lang: "en" },
      { text: "Can competitors catch up on data?", lang: "en" },
    ],
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
    annotation: "First version of the $200M AZ oncology foundation model delivered in Q2'26. Merck, BMS, Gilead, Daiichi Sankyo, GSK, BioNTech, Incyte now joined.",
    source: "Q2 2026 earnings + partnership announcements",
    followups: [
      { text: "AstraZeneca anlaşması ne hakkında?", lang: "tr" },
      { text: "Foundation model nedir?", lang: "tr" },
      { text: "Bu anlaşmalar tekrarlanabilir mi?", lang: "tr" },
      { text: "What's the AstraZeneca deal about?", lang: "en" },
      { text: "What's a foundation model?", lang: "en" },
      { text: "Can these deals be repeated?", lang: "en" },
    ],
  },

  // ─── Analyst Price Targets ───────────────────────────────────
  // These tables show ANALYST views (banks / research firms), NEVER Serkan's
  // own target. The agent cites them WITH attribution VERBALLY, then
  // redirects to the thesis. No written annotation here — duplicating what
  // the voice will say crowds the orb and forces a language choice that
  // doesn't match the user's. The table + voice is the complete experience.
  // All numbers from wiki/stocks/*.md "Analyst Target Prices" (refresh 2026-06-05).

  PLTR_targets: {
    chart_type: "targets",
    title: "Palantir — Analyst Price Targets",
    targets: [
      { firm: "Bank of America", price: 255, rating: "Buy", date: "Nov 2025", highlight: true },
      { firm: "Wedbush (Dan Ives)", price: 230, rating: "Outperform", date: "Jun 2026" },
      { firm: "Citigroup", price: 225, rating: "Buy", date: "May 2026" },
      { firm: "UBS", price: 200, rating: "Buy", date: "Mar 2026" },
      { firm: "RBC", price: 90, rating: "Underperform", date: "May 2026" },
    ],
    followups: [
      { text: "Peki sen kaçtan aldın?", lang: "tr" },
      { text: "Anahtar metrikleri göster.", lang: "tr" },
      { text: "Tezi tekrar anlat.", lang: "tr" },
      { text: "What's your cost basis?", lang: "en" },
      { text: "Show me the key metrics", lang: "en" },
      { text: "Walk me through the thesis", lang: "en" },
    ],
  },

  HOOD_targets: {
    chart_type: "targets",
    title: "Robinhood — Analyst Price Targets",
    targets: [
      { firm: "Citizens JMP", price: 155, rating: "Mkt Outperform", date: "May 2026", highlight: true },
      { firm: "Mizuho", price: 115, rating: "Outperform", date: "May 2026" },
      { firm: "Goldman Sachs", price: 105, rating: "Buy", date: "Jun 2026" },
      { firm: "KeyBanc", price: 100, rating: "Overweight", date: "Jun 2026" },
      { firm: "KBW", price: 65, rating: "Market Perform", date: "Apr 2026" },
    ],
    followups: [
      { text: "Peki sen kaçtan aldın?", lang: "tr" },
      { text: "Gold büyümesini göster.", lang: "tr" },
      { text: "Tezi tekrar anlat.", lang: "tr" },
      { text: "What's your cost basis?", lang: "en" },
      { text: "Show me Gold growth", lang: "en" },
      { text: "Walk me through the thesis", lang: "en" },
    ],
  },

  AUR_targets: {
    chart_type: "targets",
    title: "Aurora — Analyst Price Targets",
    targets: [
      { firm: "Craig-Hallum", price: 18, rating: "Buy", date: "Jun 2026", highlight: true },
      { firm: "Oppenheimer", price: 15, rating: "Outperform", date: "Oct 2025" },
      { firm: "Morgan Stanley", price: 14, rating: "Overweight", date: "May 2026" },
      { firm: "Needham", price: 13, rating: "Buy", date: "May 2026" },
      { firm: "Goldman Sachs", price: 5, rating: "Neutral", date: "Apr 2026" },
    ],
    followups: [
      { text: "Peki sen kaçtan aldın?", lang: "tr" },
      { text: "Driverless mil ilerlemesini göster.", lang: "tr" },
      { text: "Rekabet avantajı nedir?", lang: "tr" },
      { text: "What's your cost basis?", lang: "en" },
      { text: "Show me driverless miles progress", lang: "en" },
      { text: "What's the competitive edge?", lang: "en" },
    ],
  },

  NBIS_targets: {
    chart_type: "targets",
    title: "Nebius — Analyst Price Targets",
    targets: [
      { firm: "Citigroup", price: 287, rating: "Buy", date: "May 2026", highlight: true },
      { firm: "Citizens", price: 270, rating: "Mkt Outperform", date: "May 2026" },
      { firm: "DA Davidson", price: 250, rating: "Buy", date: "May 2026" },
      { firm: "Bank of America", price: 205, rating: "Buy", date: "May 2026" },
      { firm: "Morgan Stanley", price: 144, rating: "Equal-Weight", date: "May 2026" },
    ],
    followups: [
      { text: "Peki sen kaçtan aldın?", lang: "tr" },
      { text: "ARR büyümesini göster.", lang: "tr" },
      { text: "Mega anlaşmaları anlat.", lang: "tr" },
      { text: "What's your cost basis?", lang: "en" },
      { text: "Show me ARR growth", lang: "en" },
      { text: "Walk me through the mega deals", lang: "en" },
    ],
  },

  TEM_targets: {
    chart_type: "targets",
    title: "Tempus — Analyst Price Targets",
    targets: [
      { firm: "Mizuho", price: 100, rating: "Outperform", date: "Feb 2026", highlight: true },
      { firm: "BTIG", price: 80, rating: "Buy", date: "Jun 2026" },
      { firm: "Needham", price: 75, rating: "Buy", date: "Jun 2026" },
      { firm: "TD Cowen", price: 68, rating: "Buy", date: "Jun 2026" },
      { firm: "Jefferies", price: 35, rating: "Underperform", date: "Apr 2026" },
    ],
    followups: [
      { text: "Peki sen kaçtan aldın?", lang: "tr" },
      { text: "Veri moat'ı ne kadar derin?", lang: "tr" },
      { text: "Tezi tekrar anlat.", lang: "tr" },
      { text: "What's your cost basis?", lang: "en" },
      { text: "How deep is the data moat?", lang: "en" },
      { text: "Walk me through the thesis", lang: "en" },
    ],
  },

  // ─── Narrative scenes: Thesis / Risks / Catalysts ──────────────────────
  // Distilled from the vault's `## Thesis`, `## Risks`, `## Catalysts` sections
  // (wiki/stocks/*.md). 4 items per card max — the agent voices the rest if
  // the user asks deeper. The scene + the chat together = full coverage.

  // ─── Palantir narrative ──────────────────────────────────────

  PLTR_thesis: {
    chart_type: "thesis",
    title: "Palantir — Why I'm Holding",
    pillars: [
      { text: "AI işletim sistemi: Ontology + FDE + agent orchestration — 10 yıllık öncülük, kopyalanamaz." },
      { text: "Rule of 40 = 145 ve hızlanıyor. Büyük cap yazılımda eşi görülmemiş." },
      { text: "Müşteri başına değer büyüyor: bir enerji şirketi $7M → $31M ACV, yeni satış döngüsü yok." },
      { text: "Satış ekibi küçülürken U.S. commercial +137% büyüyor — müşteriler satış ekibi oldu." },
    ],
    annotation: "Yönetim 2026'da $7.19B gelir (+61%) ve Rule of 40 = 118 verdi. Üç yılda 6.5x organik büyüme.",
    followups: [
      { text: "Palantir için riskler neler?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Anahtar metrikler neler?", lang: "tr" },
      { text: "What are the risks?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "What are the key metrics?", lang: "en" },
    ],
  },

  PLTR_risks: {
    chart_type: "risks",
    title: "Palantir — Tezi Bozacak Şeyler",
    risks: [
      { title: "Valuation premium", body: "P/E baskısı sürekli. Agresif 2026 rehberinden (Rule 118) sapma multiple kompresyonu tetikler." },
      { title: "Uluslararası ticari durgunluk", body: "International commercial sadece +2% (FY2025). ABD yavaşlarsa yurtdışı telafi edemez." },
      { title: "Devlet konsantrasyonu / DOGE riski", body: "U.S. gov $1.855B (+55%). Büyük bir kontrat duraksaması çeyreklik rakamları sarsar." },
      { title: "Key-man riski", body: "Karp + Sankar yer değiştirilemez. Kültür, FDE modeli, ürün vizyonu — hepsi onlardan." },
    ],
    followups: [
      { text: "Tez neden hâlâ ayakta?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Ne zaman satarsın?", lang: "tr" },
      { text: "Why does the thesis still hold?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "When would you sell?", lang: "en" },
    ],
  },

  PLTR_catalysts: {
    chart_type: "catalysts",
    title: "Palantir — Catalyst Timeline",
    timeline: [
      { date: "Q1 2026", text: "Rekor sonuçlar: +85% gelir, Rule of 40 = 145, FY rehberi $7.65B'a yükseltildi.", status: "done" },
      { date: "Jun 4 2026", text: "AIPCon 10 dört-fırsat kümesi: GNP Seguros, McCarthy, Google Cloud, Kirkland & Ellis aynı gün.", status: "done" },
      { date: "2026 H2", text: "Maven full rollout + Maven Edge (autonomous live-fire UAV koordinasyonu) tüm komutanlıklara.", status: "upcoming" },
      { date: "2026-27", text: "ShipOS modeli: fighters, surface vessels, drones, pharma, data center inşaatına yayılım.", status: "upcoming" },
    ],
    followups: [
      { text: "Tez neden bu kadar güçlü?", lang: "tr" },
      { text: "Riskler neler?", lang: "tr" },
      { text: "AIPCon 10 ne demek?", lang: "tr" },
      { text: "Why is the thesis so strong?", lang: "en" },
      { text: "What are the risks?", lang: "en" },
      { text: "What was AIPCon 10?", lang: "en" },
    ],
  },

  // ─── Robinhood narrative ─────────────────────────────────────

  HOOD_thesis: {
    chart_type: "thesis",
    title: "Robinhood — Why I'm Holding",
    pillars: [
      { text: "Artık aracı kurum değil: tam yığın finansal platform — $4.5B gelir, $2.5B EBITDA, %56 marj." },
      { text: "11 farklı $100M+ ARR işi. 12. ürünün marjinal maliyeti sıfıra yakın — gerçek flywheel." },
      { text: "Tahmin piyasaları sleeper: 1. yılda $12B; Rothera + Susquehanna JV. Şirket tarihinin en hızlı $100M ARR'ı." },
      { text: "AI ile 9-haneli mühendislik tasarrufu, %75+ destek otomasyonu. Gelir +52% büyürken gider disipline." },
    ],
    annotation: "S&P 500'e Haziran 2025'te girdi — endeks fonları zorunlu alıcı. Vlad Tenev artık ürün + sermaye + iletişim CEO'su.",
    followups: [
      { text: "Robinhood için riskler neler?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Gold üyelikleri ne durumda?", lang: "tr" },
      { text: "What are the risks?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "How is Gold growing?", lang: "en" },
    ],
  },

  HOOD_risks: {
    chart_type: "risks",
    title: "Robinhood — Tezi Bozacak Şeyler",
    risks: [
      { title: "İşlem geliri volatilitesi", body: "Options + crypto piyasa volatilitesine bağlı. Uzun durgunluk işlem gelirini sıkıştırır." },
      { title: "Tahmin piyasaları regülatif risk", body: "Eyalet bazlı meydan okumalar var. Federal/çoklu-eyalet kıskaç $300M+ ARR'ı vurabilir." },
      { title: "PFOF / options regülasyonu", body: "#1 options pazar payı = SEC PFOF reformunun en görünür hedefi." },
      { title: "Bankacılık execution riski", body: "25K erken kullanıcıda %50+ direct deposit umut verici ama milyonlara ölçeklendirme kanıtlanmadı." },
    ],
    followups: [
      { text: "Tez neden hâlâ ayakta?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Ne zaman satarsın?", lang: "tr" },
      { text: "Why does the thesis still hold?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "When would you sell?", lang: "en" },
    ],
  },

  HOOD_catalysts: {
    chart_type: "catalysts",
    title: "Robinhood — Catalyst Timeline",
    timeline: [
      { date: "Jun 2025", text: "S&P 500 dahil edildi — endeks fonları zorunlu alıcı, kalıcı kurumsal taban.", status: "done" },
      { date: "May 27 2026", text: "Open to Agents: ilk MCP-native broker. Agent-driven hesap akışı için altyapı.", status: "done" },
      { date: "Jul 4 2026", text: "Trump Accounts lansmanı — federal IRA programı için Treasury trustee. ~$14B potansiyel AUM.", status: "upcoming" },
      { date: "2026 H2", text: "Robinhood Banking ulusal rollout (3.5% APY) + Gold Card 1M+ holder hedefi.", status: "upcoming" },
    ],
    followups: [
      { text: "Tez neden bu kadar güçlü?", lang: "tr" },
      { text: "Riskler neler?", lang: "tr" },
      { text: "Tahmin piyasaları ne kadar büyük?", lang: "tr" },
      { text: "Why is the thesis so strong?", lang: "en" },
      { text: "What are the risks?", lang: "en" },
      { text: "How big are prediction markets?", lang: "en" },
    ],
  },

  // ─── Aurora narrative ────────────────────────────────────────

  AUR_thesis: {
    chart_type: "thesis",
    title: "Aurora — Why I'm Holding",
    pillars: [
      { text: "Uzun vadeli yapısal bahis: ABD lojistiğinde sürücü açığı kötüleşiyor, otonom kamyon = en açık çözüm." },
      { text: "8.5 yıllık güvenlik-öncelikli geliştirme; Nisan 2025'te ticari driverless lansman. 250K mil, sıfır kaza." },
      { text: "Validasyon altyapısı az fark edilen moat: yeni rotaları günler/haftalarda doğruluyorlar — SpaceX avantajı." },
      { text: "OEM + donanım + müşteri ilişkileri yerinde. 2026 = ticari modeli kanıtlama; 2027 = DaaS modeli + AUMOVIO." },
    ],
    annotation: "Pozisyon ~10%. İlk alış Şub 2025 @ $7.91/$6.83, ortalama ~$6.60, DCA sürüyor.",
    followups: [
      { text: "Aurora için riskler neler?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Kaç mil sürdüler driverless?", lang: "tr" },
      { text: "What are the risks?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "How many driverless miles?", lang: "en" },
    ],
  },

  AUR_risks: {
    chart_type: "risks",
    title: "Aurora — Tezi Bozacak Şeyler",
    risks: [
      { title: "Filo rampası execution riski", body: "200+ kamyon yıl sonu hedefi Roush'tan haftada 20 upfit gerektiriyor. Herhangi gecikme geliri öteler." },
      { title: "Düşük marj zamanlaması kayması", body: "Run-rate breakeven GM 2026 çıkışı — ticari lansman gibi 2027'ye kayabilir." },
      { title: "AUMOVIO Gen 3 execution", body: "2027 üretim başlangıcı çok-taraflı bağımlılık. Slip = on binlerce kamyon ölçeğini geciktirir." },
      { title: "Regülatif kırılganlık", body: "Tek bir ciddi olay eyalet bazlı moratoryumları tetikler. AMERICA DRIVES Act yardımcı ama henüz yasa değil." },
    ],
    followups: [
      { text: "Tez neden hâlâ ayakta?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Ne zaman satarsın?", lang: "tr" },
      { text: "Why does the thesis still hold?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "When would you sell?", lang: "en" },
    ],
  },

  AUR_catalysts: {
    chart_type: "catalysts",
    title: "Aurora — Catalyst Timeline",
    timeline: [
      { date: "Apr 2025", text: "Ticari driverless lansman — 8.5 yıllık güvenlik geliştirmesinden sonra ilk gönderi.", status: "done" },
      { date: "Q1 2026", text: "Dallas-Laredo driverless validasyonu — yeni rota açılışı.", status: "done" },
      { date: "Q2 2026", text: "International LT filosu observer olmadan driverless geçiyor — kamyon sayısında basamak.", status: "upcoming" },
      { date: "Q4 2026", text: "~200+ kamyon, ~$80M gelir run-rate. DaaS anlatısı resmen başlıyor.", status: "upcoming" },
    ],
    followups: [
      { text: "Tez neden bu kadar güçlü?", lang: "tr" },
      { text: "Riskler neler?", lang: "tr" },
      { text: "DaaS modeli ne demek?", lang: "tr" },
      { text: "Why is the thesis so strong?", lang: "en" },
      { text: "What are the risks?", lang: "en" },
      { text: "What is the DaaS model?", lang: "en" },
    ],
  },

  // ─── Nebius narrative ────────────────────────────────────────

  NBIS_thesis: {
    chart_type: "thesis",
    title: "Nebius — Why I'm Holding",
    pillars: [
      { text: "Founder-led full-stack AI altyapısı. 18 ayda sıfırdan dünya lideri arasında — Volozh patterni." },
      { text: "Kendi kendini finanse eden hipergrowth: Microsoft $17B + Meta $3B ön ödemeleri 2026 CapEx'in ~%60'ını karşılıyor." },
      { text: "Her çeyrek sold out. Q4'te fiyatlar +%50, 12+ aylık kontratlar 2x. Arz problemi, talep değil." },
      { text: "Gizli değer: ClickHouse stake (~$15B), Avride, Toloka — tek başına AI cloud tezine fiyatlanmıyor." },
    ],
    annotation: "Pozisyon küçük (~3%) çünkü execution riski gerçek. Ama asimetri risk profiline tam oturuyor.",
    followups: [
      { text: "Nebius için riskler neler?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "ARR nereye gidiyor?", lang: "tr" },
      { text: "What are the risks?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "Where is ARR heading?", lang: "en" },
    ],
  },

  NBIS_risks: {
    chart_type: "risks",
    title: "Nebius — Tezi Bozacak Şeyler",
    risks: [
      { title: "CapEx execution riski", body: "$16-20B 2026 CapEx olağanüstü. Veri merkezi gecikmesi, tedarik aksaklığı kapasiteyi öteler." },
      { title: "Finansman execution riski", body: "CapEx'in ~%40'ı kurumsal borç + asset-backed finansmana bağlı. Kredi piyasası daralabilir." },
      { title: "Talep konsantrasyonu", body: "Microsoft + Meta dev ilişkiler. Birinde execution sorunu finansal etki büyük." },
      { title: "Hyperscaler rekabeti", body: "AWS, GCP, Azure Avrupa'da kapasite artırırsa data sovereignty argümanı zayıflar." },
    ],
    followups: [
      { text: "Tez neden hâlâ ayakta?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Ne zaman satarsın?", lang: "tr" },
      { text: "Why does the thesis still hold?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "When would you sell?", lang: "en" },
    ],
  },

  NBIS_catalysts: {
    chart_type: "catalysts",
    title: "Nebius — Catalyst Timeline",
    timeline: [
      { date: "May 20 2026", text: "Bloom Energy ortaklığı: 328 MW yakıt hücresi — şebeke gecikmesini bypass.", status: "done" },
      { date: "Jun 8 2026", text: "UK £1.7B / 65 MW genişleme; UK AI Bakanı endorse, Revolut anchor müşteri.", status: "done" },
      { date: "Jun 9 2026", text: "Physical AI Living Lab — NVIDIA Inception → robotik startup pipeline.", status: "done" },
      { date: "2026", text: "Microsoft + Meta tam ramp; 2026 ARR rehberi $7-9B (>%50 zaten kontratlı).", status: "upcoming" },
    ],
    followups: [
      { text: "Tez neden bu kadar güçlü?", lang: "tr" },
      { text: "Riskler neler?", lang: "tr" },
      { text: "ClickHouse stake ne kadar?", lang: "tr" },
      { text: "Why is the thesis so strong?", lang: "en" },
      { text: "What are the risks?", lang: "en" },
      { text: "How big is the ClickHouse stake?", lang: "en" },
    ],
  },

  // ─── Tempus narrative ────────────────────────────────────────

  TEM_thesis: {
    chart_type: "thesis",
    title: "Tempus — Why I'm Holding",
    pillars: [
      { text: "Hidden Moat compounder: her test daha değerli veri yaratıyor — proprietary data flywheel." },
      { text: "Veri segmenti %73+ brüt marj, 126% NRR. Ölçek büyüdükçe karışım yüksek marjlı veriye kayıyor." },
      { text: "2026 ilk Adj. EBITDA pozitif (~$65M). Hızla büyüyen healthcare AI şirketleri arasında ölçekte." },
      { text: "Asimetrik opsiyon: AI algoritmaları CPT geri ödemesi alırsa, dağıtım hazır (5,000+ hastane) — $100M → $1B 'overnight'." },
    ],
    annotation: "Yönetim 3 yıl boyunca ~%25 onkoloji birim büyüme hedefliyor. AstraZeneca $200M foundation model deal'i tez doğrulayıcı.",
    followups: [
      { text: "Tempus için riskler neler?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Veri moat'ı ne kadar derin?", lang: "tr" },
      { text: "What are the risks?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "How deep is the data moat?", lang: "en" },
    ],
  },

  TEM_risks: {
    chart_type: "risks",
    title: "Tempus — Tezi Bozacak Şeyler",
    risks: [
      { title: "Borç yükü", body: "$728M convertible + $203M long-term + $209M not. May 2026 $400M sıfır faizli refinansman temizledi ama yük hâlâ var." },
      { title: "İnorganik gelir bağımlılığı", body: "Diagnostics büyümesinin ~%50'si Ambry'den. Organik %33.5 hâlâ güçlü ama başlık rakamından düşük." },
      { title: "Geri ödeme riski", body: "Diagnostics geliri sigorta/Medicare oranlarına bağlı. Politika değişikliği ASP'leri sıkıştırır." },
      { title: "Rekabet", body: "Exact Sciences, Foundation Medicine (Roche), Guardant Health onkoloji genomiğinde rakip." },
    ],
    followups: [
      { text: "Tez neden hâlâ ayakta?", lang: "tr" },
      { text: "Yaklaşan katalistler neler?", lang: "tr" },
      { text: "Ne zaman satarsın?", lang: "tr" },
      { text: "Why does the thesis still hold?", lang: "en" },
      { text: "What catalysts are coming?", lang: "en" },
      { text: "When would you sell?", lang: "en" },
    ],
  },

  TEM_personalis: {
    chart_type: "metric",
    title: "Tempus → Personalis: MRD'yi İçselleştirmek",
    data: [
      { label: "Deal Enterprise Value", value: 1.5, unit: "$B" },
      { label: "Hisse Başına", value: 16.25, unit: "$" },
      { label: "MRD hacminin ~%97'si", value: 97, unit: "%" },
      { label: "MRD hacim opsiyonalitesi", value: 20, unit: "x" },
    ],
    annotation: "Positive but cautious. Stratejik olarak doğru: crown-jewel MRD motoru (NeXT Personal whole-genome tumor-informed) artık içerde, 'Personalis nakit yanması' engeli kalkıyor → 20x hacim matematiği değişiyor. Ama ~%100 hisse takası, kârlılık öncesi dilüsyonu büyütüyor. Tutuyorum, izliyorum, ekleme yapmıyorum.",
    source: "Tempus press release, July 20, 2026",
    followups: [
      { text: "Neden temkinlisin?", lang: "tr" },
      { text: "MRD neden bu kadar önemli?", lang: "tr" },
      { text: "Dilüsyon ne kadar büyük?", lang: "tr" },
      { text: "Why cautious?", lang: "en" },
      { text: "Why does MRD matter this much?", lang: "en" },
      { text: "How big is the dilution risk?", lang: "en" },
    ],
  },

  TEM_catalysts: {
    chart_type: "catalysts",
    title: "Tempus — Catalyst Timeline",
    timeline: [
      { date: "Apr 2026", text: "ALERT trial: kardiyak valf prosedürlerinde %40 artış (peer-reviewed) — kardiyoloji validasyonu.", status: "done" },
      { date: "May 27-31 2026", text: "ASCO carpet bomb: Hub, Next, xT CDx FDA, Foundation Model sonuçları, Preview, Lens — 6 büyük lansman.", status: "done" },
      { date: "May 29 2026", text: "xT CDx tumor-only FDA onayı: 2027'den itibaren ~$200 ASP uplift — yıllık ~$68M ek gelir potansiyeli.", status: "done" },
      { date: "2026-27", text: "xF FDA onayı (liquid biopsy), xH whole genome heme lansmanı, algoritma CPT geri ödeme opsiyonu.", status: "upcoming" },
    ],
    followups: [
      { text: "Tez neden bu kadar güçlü?", lang: "tr" },
      { text: "Riskler neler?", lang: "tr" },
      { text: "AstraZeneca deal'i ne?", lang: "tr" },
      { text: "Why is the thesis so strong?", lang: "en" },
      { text: "What are the risks?", lang: "en" },
      { text: "What's the AstraZeneca deal?", lang: "en" },
    ],
  },
};
