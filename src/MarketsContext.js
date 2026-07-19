import React, { createContext, useContext, useRef, useState } from "react";
import { signInShared, subscribeMarkets, saveMarket, createMarket, deleteMarket } from "./markets";
import { fetchQuote } from "./quotes";
import { setupNotifications, registerBackgroundAlerts,
  takeMomentumReason, sendMomentumNotification } from "./alerts";

const MarketsContext = createContext(null);
export const useMarkets = () => useContext(MarketsContext);

export function MarketsProvider({ children }) {
  const [markets, setMarkets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const marketsRef = useRef([]);
  const startedRef = useRef(false);

  const setAll = (list) => {
    marketsRef.current = list;
    setMarkets(list);
  };

  // Called after a successful login: sign in, set up alerts, then subscribe.
  async function start() {
    await signInShared();
    if (!startedRef.current) {
      startedRef.current = true;
      await setupNotifications();      // request permission before first snapshot
      registerBackgroundAlerts();      // background checks (standalone builds)
      subscribeMarkets(setAll);
      // Re-check prices every 4 hours while open; momentum alerts fire inside.
      setInterval(refreshQuotes, 4 * 60 * 60 * 1000);
    }
  }

  async function refreshQuotes() {
    if (refreshing) return;
    setRefreshing(true);
    const momHits = [];
    try {
      for (const m of marketsRef.current) {
        const sym = (m.quote || m.symbol || "").trim();
        if (!sym) continue;
        try {
          const q = await fetchQuote(sym);
          await saveMarket({
            ...m,
            price: String(q.price),
            changeDay: q.changeDay != null ? String(q.changeDay) : "",
            changeWeek: q.changeWeek != null ? String(q.changeWeek) : "",
            changeMonth: q.changeMonth != null ? String(q.changeMonth) : "",
            change3d: q.change3d != null ? String(q.change3d) : "",
          });
          const reason = takeMomentumReason(m.id, q);
          if (reason) momHits.push({ name: m.name, reason });
        } catch (e) { /* skip this symbol */ }
      }
      setLastRefresh(Date.now());
      sendMomentumNotification(momHits);
    } finally {
      setRefreshing(false);
    }
  }

  const value = {
    markets, refreshing, lastRefresh,
    start, refreshQuotes,
    createMarket, saveMarket, deleteMarket,
  };
  return <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>;
}
