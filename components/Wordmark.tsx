import { Sora, Playfair_Display } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-sora",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-playfair",
});

interface WordmarkProps {
  showTagline?: boolean;
}

export function Wordmark({ showTagline = false }: WordmarkProps) {
  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 flex flex-col items-center select-none z-10">
      <div className="flex items-baseline gap-1.5">
        <span
          className={`${sora.className} text-[26px] font-light text-[#706860] tracking-[5px] uppercase max-md:text-[20px] max-md:tracking-[4px]`}
        >
          Investing
        </span>
        <span
          className={`${playfair.className} text-[28px] font-medium text-[#c8a050] tracking-[1px] italic max-md:text-[22px]`}
        >
          Brain
        </span>
      </div>
      {showTagline && (
        <p className="mt-3 text-[15px] text-[#706860] tracking-[0.5px] font-light whitespace-nowrap max-md:text-[13px]">
          Talk to my investing thesis.
        </p>
      )}
    </div>
  );
}
