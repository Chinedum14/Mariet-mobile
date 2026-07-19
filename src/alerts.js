// Momentum alerts: local notifications (foreground) + a background task that
// re-checks prices even when the app is closed (standalone/dev builds only —
// background execution does not run in Expo Go).
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";

import { signInShared, getMarketsOnce, saveMarket } from "./markets";
import { fetchQuote } from "./quotes";
import { MOMENTUM_DAY_PCT, MOMENTUM_3D_PCT } from "./format";

const ACCENT = "#d8a34a";
// Android channel id kept as "targets" for continuity with existing installs;
// its display name reflects the current (momentum-only) purpose.
const CHANNEL = "targets";
const CHECK_TASK = "playmarkets-target-check";

// Show notifications even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let ready = false;

export async function setupNotifications() {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "Momentum alerts",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: ACCENT,
      });
    }
    ready = status === "granted";
  } catch (e) {
    console.log("notif setup failed", e?.message || e);
  }
  return ready;
}

export function notificationsReady() {
  return ready;
}

// ---- Momentum alerts (fast risers) ----
// Per-day dedup so a market that stays above threshold isn't re-alerted all day.
let momentumDay = "";
const momentumSeen = new Set();

function dayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Returns a reason for any momentum rule that NEWLY fired today for this market
// (marking it so it won't re-alert), or null. When a rule no longer holds its
// mark is cleared, so a genuine fresh spike later the same day alerts again.
// `q` is a fresh quote with numeric changeDay / change3d.
export function takeMomentumReason(id, q) {
  const stamp = dayStamp();
  if (stamp !== momentumDay) { momentumDay = stamp; momentumSeen.clear(); }

  const day = Number(q?.changeDay);
  const d3 = Number(q?.change3d);
  const parts = [];

  if (Number.isFinite(day) && day >= MOMENTUM_DAY_PCT) {
    if (!momentumSeen.has(`${id}:day`)) {
      momentumSeen.add(`${id}:day`);
      parts.push(`up ${day}% today`);
    }
  } else {
    momentumSeen.delete(`${id}:day`); // re-arm once it drops back below threshold
  }

  if (Number.isFinite(d3) && d3 >= MOMENTUM_3D_PCT) {
    if (!momentumSeen.has(`${id}:3d`)) {
      momentumSeen.add(`${id}:3d`);
      parts.push(`up ${d3}% over 3 trading days`);
    }
  } else {
    momentumSeen.delete(`${id}:3d`);
  }

  return parts.length ? parts.join(" · ") : null;
}

// Fires one PlayMarkets-branded notification summarising fast-rising markets.
// `hits` is an array of { name, reason }.
export async function sendMomentumNotification(hits) {
  if (!ready || !hits || !hits.length) return;
  const title = hits.length === 1
    ? `${hits[0].name} is moving`
    : `${hits.length} markets moving`;
  const body = hits.map((h) => `${h.name}: ${h.reason}`).join("\n");
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, color: ACCENT, sound: true },
      trigger: Platform.OS === "android" ? { channelId: CHANNEL, seconds: 1 } : null,
    });
  } catch (e) {
    console.log("momentum notify failed", e?.message || e);
  }
}

// Refreshes prices and notifies about anything rising fast. Used by the
// background task (app closed) and reusable on a foreground interval.
export async function runMomentumCheck() {
  await signInShared();
  const list = await getMarketsOnce();
  const momHits = [];
  for (const m of list) {
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
    } catch (e) { /* keep last-known price */ }
  }
  await sendMomentumNotification(momHits);
}

// ---- Background task (runs when the app is closed; not in Expo Go) ----
TaskManager.defineTask(CHECK_TASK, async () => {
  try {
    // Notifications may need setup in the headless context.
    if (!ready) await setupNotifications();
    await runMomentumCheck();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.log("bg task failed", e?.message || e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundAlerts() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    const already = await TaskManager.isTaskRegisteredAsync(CHECK_TASK);
    if (!already) {
      await BackgroundTask.registerTaskAsync(CHECK_TASK, { minimumInterval: 240 }); // ~4h (minutes)
    }
  } catch (e) {
    // Not available (e.g. Expo Go) — foreground alerts still work.
    console.log("background alerts unavailable:", e?.message || e);
  }
}
