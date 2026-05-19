"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import stocks, { type Stock } from "@/lib/stocks";

interface StockBadgeProps {
  stock: Stock | null;
  isConnected: boolean;
}

const allStocks = Object.values(stocks);

export function StockBadge({ stock, isConnected }: StockBadgeProps) {
  const showAll = !stock;

  return (
    <div className="h-[80px] flex items-end justify-center">
      <AnimatePresence mode="wait">
        {showAll ? (
          <motion.div
            key="all-stocks"
            className="flex items-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            {allStocks.map((s, i) => (
              <motion.div
                key={s.ticker}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: "rgba(200, 160, 80, 0.12)",
                    border: "1px solid rgba(200, 160, 80, 0.18)",
                  }}
                >
                  <Image
                    src={s.logo}
                    alt={s.name}
                    width={18}
                    height={18}
                    style={{ width: "auto", height: "auto", maxWidth: 18, maxHeight: 18 }}
                    className="brightness-0 invert opacity-50"
                  />
                </div>
                <span
                  className="text-[8px] tracking-[1px] font-normal opacity-40"
                  style={{ color: "#b89850", fontFamily: "var(--font-sans)" }}
                >
                  {s.ticker}
                </span>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={stock.ticker}
            className="flex flex-col items-center gap-1.5"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{
                background: "rgba(200, 160, 80, 0.1)",
                border: "1px solid rgba(200, 160, 80, 0.2)",
              }}
            >
              <Image
                src={stock.logo}
                alt={stock.name}
                width={22}
                height={22}
                style={{ width: "auto", height: "auto", maxWidth: 22, maxHeight: 22 }}
                className="brightness-0 invert opacity-70"
              />
            </div>
            <span
              className="text-[10px] tracking-[1.5px] font-normal"
              style={{ color: "#b89850", fontFamily: "var(--font-sans)" }}
            >
              ${stock.ticker}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
