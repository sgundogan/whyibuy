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
      { label: "Q1'25", value: 884, unit: "$M" },
      { label: "Q2'25", value: 1004, unit: "$M" },
      { label: "Q3'25", value: 1181, unit: "$M" },
      { label: "Q4'25", value: 1407, unit: "$M" },
      { label: "Q1'26", value: 1633, unit: "$M", highlight: true },
    ],
    annotation: "Q1'26: $1.633B revenue (+85% YoY) — highest growth rate as a public company. US revenue +104% YoY.",
    source: "Q1 2026 earnings report",
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
    title: "Palantir Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 1633, unit: "$M" },
      { label: "Adj. FCF Margin", value: 0.57, unit: "%" },
      { label: "Rule of 40", value: 145, unit: "%" },
      { label: "Net Dollar Retention", value: 150, unit: "%" },
    ],
    annotation: "Rule of 40 hit 145% — highest among all large-cap companies globally. NDR +1,100bps QoQ to 150%.",
    source: "Q1 2026 earnings report",
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
    title: "Palantir Revenue Mix (Q1 2026)",
    data: [
      { label: "US Commercial", value: 595, unit: "$M" },
      { label: "US Government", value: 687, unit: "$M" },
      { label: "Int'l Commercial", value: 179, unit: "$M" },
      { label: "Int'l Government", value: 172, unit: "$M" },
    ],
    annotation: "US Commercial revenue +133% YoY — AIP is the engine. US Government still 42% of total but growing 84%.",
    source: "Q1 2026 earnings report",
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
      { label: "Q1'25", value: 927, unit: "$M" },
      { label: "Q2'25", value: 989, unit: "$M" },
      { label: "Q3'25", value: 1274, unit: "$M" },
      { label: "Q4'25", value: 1283, unit: "$M" },
      { label: "Q1'26", value: 1067, unit: "$M", highlight: true },
    ],
    annotation: "FY2025: $4.47B revenue (+52% YoY). Q1'26 +15% YoY despite tough crypto/election comp.",
    source: "Q1 2026 earnings",
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
    title: "Robinhood Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 1067, unit: "$M" },
      { label: "Adj. EBITDA Margin", value: 0.5, unit: "%" },
      { label: "LTM Rule of 40", value: 112, unit: "%" },
      { label: "Diluted EPS", value: 0.38, unit: "$" },
    ],
    annotation: "LTM Adj. EBITDA hit a record $2.6B at 56% margin. Rule of 40 at 112% LTM.",
    source: "Q1 2026 earnings presentation",
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
      { label: "Q1'25", value: 3.19, unit: "M" },
      { label: "Q2'25", value: 3.48, unit: "M" },
      { label: "Q3'25", value: 3.88, unit: "M" },
      { label: "Q4'25", value: 4.18, unit: "M" },
      { label: "Q1'26", value: 4.34, unit: "M" },
    ],
    annotation: "Gold hit 4.34M subscribers (+36% YoY, 15.8% adoption). The retention flywheel keeps compounding.",
    source: "Q1 2026 earnings",
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
      { label: "Q1'25", value: 221, unit: "$B" },
      { label: "Q2'25", value: 279, unit: "$B" },
      { label: "Q3'25", value: 333, unit: "$B" },
      { label: "Q4'25", value: 322, unit: "$B" },
      { label: "Q1'26", value: 307, unit: "$B" },
    ],
    annotation: "$307B in platform assets (+39% YoY). $67.8B in LTM net deposits — wallet share winning.",
    source: "Q1 2026 earnings",
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
      { label: "Q1'26", value: 3.4, highlight: true },
    ],
    annotation: "Prediction markets at $415M annualized — the fastest $100M ARR business in HOOD history.",
    source: "Q1 2026 earnings",
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
      { label: "Q1'25", value: 0 },
      { label: "Q2'25", value: 1 },
      { label: "Q3'25", value: 1 },
      { label: "Q4'25", value: 1 },
      { label: "Q1'26", value: 1, highlight: true },
    ],
    annotation: "FY2025: $3M (first revenue). 2026 guide: $14-16M (+400% YoY). Exit run-rate target: $80M.",
    source: "Q1 2026 earnings",
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
      { label: "Apr'25", value: 4, unit: "K" },
      { label: "Jun'25", value: 20, unit: "K" },
      { label: "Oct'25", value: 100, unit: "K" },
      { label: "Jan'26", value: 250, unit: "K" },
      { label: "Apr'26", value: 370, unit: "K" },
    ],
    annotation: "Zero to 370K driverless miles in 12 months. Zero Aurora-attributed collisions. 100% on-time.",
    source: "Q1 2026 earnings",
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
    title: "Aurora Operational Snapshot (Q1 2026)",
    data: [
      { label: "Driverless Routes", value: 12 },
      { label: "Driverless Customers", value: 7 },
      { label: "Driverless Miles", value: 370, unit: "K" },
      { label: "On-Time Performance", value: 100, unit: "%" },
    ],
    annotation: "12-route driverless network with McLane (Berkshire) joining Q1'26. California approved AV trucking — SAM expanding to 60B VMT by 2028.",
    source: "Q1 2026 earnings",
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
      { label: "Q1'25", value: 55, unit: "$M" },
      { label: "Q2'25", value: 105, unit: "$M" },
      { label: "Q3'25", value: 146, unit: "$M" },
      { label: "Q4'25", value: 228, unit: "$M" },
      { label: "Q1'26", value: 399, unit: "$M", highlight: true },
    ],
    annotation: "Q1'26: $399M revenue (+684% YoY, +75% QoQ). 2026 guide: $3B-$3.4B — 6x FY2025.",
    source: "Q1 2026 shareholder letter",
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
      { label: "Mar'25", value: 249, unit: "$M" },
      { label: "Jun'25", value: 430, unit: "$M" },
      { label: "Sep'25", value: 551, unit: "$M" },
      { label: "Dec'25", value: 1250, unit: "$M" },
      { label: "Mar'26", value: 1920, unit: "$M" },
    ],
    annotation: "ARR grew 7.7x in 12 months. 2026 exit target: $7B-$9B with >50% already contracted.",
    source: "Q1 2026 shareholder letter",
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
    title: "Nebius Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 399, unit: "$M" },
      { label: "Adj. EBITDA Margin", value: 0.32, unit: "%" },
      { label: "Cash on Hand", value: 9.3, unit: "$B" },
      { label: "Contracted Power", value: 3.5, unit: "GW" },
    ],
    annotation: "First profitable quarter at scale. $2.3B operating cash flow Q1'26 (Microsoft + Meta prepayments).",
    source: "Q1 2026 shareholder letter",
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
      { label: "Q1'25", value: 544, unit: "$M" },
      { label: "Q2'25", value: 511, unit: "$M" },
      { label: "Q3'25", value: 956, unit: "$M" },
      { label: "Q4'25", value: 2100, unit: "$M" },
      { label: "Q1'26", value: 2500, unit: "$M", highlight: true },
    ],
    annotation: "2026 CapEx raised to $20-25B (from $16-20B). Staged model: land/power first (1%), data centers (20%), GPUs (80%) only against visible demand.",
    source: "Q1 2026 shareholder letter",
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
    annotation: "Anchor customers prepay capacity → funds ~60% of 2026 CapEx. ClickHouse 25% stake = hidden optionality.",
    source: "Q1 2026 shareholder letter",
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
      { label: "Q1'25", value: 256, unit: "$M" },
      { label: "Q2'25", value: 315, unit: "$M" },
      { label: "Q3'25", value: 334, unit: "$M" },
      { label: "Q4'25", value: 367, unit: "$M" },
      { label: "Q1'26", value: 348, unit: "$M", highlight: true },
    ],
    annotation: "FY2025: $1.27B (+83% YoY). 2026 guide: $1.59-1.60B revenue + ~$65M Adj. EBITDA — first profitable year.",
    source: "Q1 2026 earnings",
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
    title: "Tempus Revenue Mix (Q1 2026)",
    data: [
      { label: "Oncology Dx", value: 147, unit: "$M" },
      { label: "Hereditary Dx", value: 100, unit: "$M" },
      { label: "Other Dx", value: 14, unit: "$M" },
      { label: "Data & Applications", value: 87, unit: "$M" },
    ],
    annotation: "Diagnostics generates the data; Data & Applications monetizes it at ~73% gross margins with 126% NRR.",
    source: "Q1 2026 earnings",
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
    title: "Tempus Key Metrics (Q1 2026)",
    data: [
      { label: "Revenue", value: 348, unit: "$M" },
      { label: "Non-GAAP Gross Margin", value: 0.65, unit: "%" },
      { label: "Net Revenue Retention", value: 126, unit: "%" },
      { label: "Total Contract Value", value: 1.1, unit: "$B" },
    ],
    annotation: "TCV grew Q1'26 despite delivering $80M+ revenue — backlog increasing. Path to first profitable year.",
    source: "Q1 2026 earnings",
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
    annotation: "$200M AZ foundation model deal: first proof. Merck, BMS, Gilead, Daiichi Sankyo, GSK now joined.",
    source: "Q1 2026 + partnership announcements",
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
};
