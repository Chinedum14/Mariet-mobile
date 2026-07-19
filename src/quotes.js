// Live quotes from Yahoo Finance's public chart endpoint.
// Mirrors the desktop backend: day/week/month % change computed from the daily
// history vs the live price (NOT chartPreviousClose, which is range-relative).

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function round2(v) {
  return Math.round(v * 100) / 100;
}

function pctChange(current, reference) {
  if (!reference) return null;
  return round2(((current - reference) / reference) * 100);
}

// Last close at or before `days` calendar days before lastTs (points ascending).
function closeDaysBack(points, lastTs, days) {
  const target = lastTs - days * 86400;
  let best = null;
  for (const [ts, close] of points) {
    if (ts <= target) best = close;
  }
  return best != null ? best : points.length ? points[0][1] : null;
}

// Close `n` trading sessions before the latest session. `points` is ascending
// and each entry is one trading day, so this counts trading days, not calendar
// days. Falls back to the earliest close when history is short.
function closeTradingDaysBack(points, n) {
  if (!points.length) return null;
  return points.length > n ? points[points.length - 1 - n][1] : points[0][1];
}

// Fetches one symbol; returns { price, changeDay, changeWeek, changeMonth, change3d } or throws.
export async function fetchQuote(symbol) {
  const sym = String(symbol || "").trim();
  if (!sym) throw new Error("no symbol");
  const enc = encodeURIComponent(sym);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${enc}?interval=1d&range=3mo`;

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  const price = meta?.regularMarketPrice;
  if (typeof price !== "number") throw new Error("no price in response");

  const ts = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const points = [];
  for (let i = 0; i < ts.length; i++) {
    if (typeof ts[i] === "number" && typeof closes[i] === "number") {
      points.push([ts[i], closes[i]]);
    }
  }

  let changeDay = null, changeWeek = null, changeMonth = null, change3d = null;
  if (points.length) {
    const lastTs = points[points.length - 1][0];
    changeDay = pctChange(price, closeDaysBack(points, lastTs, 1));
    changeWeek = pctChange(price, closeDaysBack(points, lastTs, 7));
    changeMonth = pctChange(price, closeDaysBack(points, lastTs, 30));
    change3d = pctChange(price, closeTradingDaysBack(points, 3));
  }

  return { price: round2(price), changeDay, changeWeek, changeMonth, change3d };
}
