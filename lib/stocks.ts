export interface Stock {
  ticker: string;
  name: string;
  logo: string;
  initial: string;
}

const stocks: Record<string, Stock> = {
  PLTR: { ticker: "PLTR", name: "Palantir", logo: "/logos/pltr.svg", initial: "P" },
  HOOD: { ticker: "HOOD", name: "Robinhood", logo: "/logos/hood.svg", initial: "R" },
  TEM: { ticker: "TEM", name: "Tempus", logo: "/logos/tem.svg", initial: "T" },
  NBIS: { ticker: "NBIS", name: "Nebius", logo: "/logos/nbis.svg", initial: "N" },
  AUR: { ticker: "AUR", name: "Aurora", logo: "/logos/aur.svg", initial: "A" },
};

export function getStock(ticker: string): Stock | undefined {
  return stocks[ticker.toUpperCase()];
}

export default stocks;
