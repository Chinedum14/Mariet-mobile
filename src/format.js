import { colors } from "./theme";

// Colour + arrow + text for a change value (string or number).
export function changeInfo(raw) {
  const n = parseFloat(raw);
  if (raw === "" || raw == null || isNaN(n)) {
    return { color: colors.flat, arrow: "—", pct: "" };
  }
  const pct = (n > 0 ? "+" : "") + n + "%";
  const color = n > 0 ? colors.up : n < 0 ? colors.down : colors.flat;
  const arrow = n > 0 ? "↗" : n < 0 ? "↘" : "—";
  return { color, arrow, pct };
}

export function priceLabel(raw) {
  if (!raw) return "";
  const p = String(raw).replace(/^\$/, "").trim();
  return p ? "$" + p : "";
}

// Momentum thresholds: a rise of this much in one trading day, or over the last
// 3 trading days, counts as "rising fast".
export const MOMENTUM_DAY_PCT = 3;
export const MOMENTUM_3D_PCT = 6;

// True when a market currently satisfies either momentum rule. Drives the green
// dot; derived from live fields so it clears itself once prices update.
export function hasMomentum(m) {
  const day = parseFloat(m.changeDay);
  const d3 = parseFloat(m.change3d);
  return (!isNaN(day) && day >= MOMENTUM_DAY_PCT) || (!isNaN(d3) && d3 >= MOMENTUM_3D_PCT);
}
