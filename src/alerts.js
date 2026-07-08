// Target-price alerts: local notifications (foreground) + a background task that
// re-checks prices even when the app is closed (standalone/dev builds only —
// background execution does not run in Expo Go).
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";

import { signInShared, getMarketsOnce, saveMarket } from "./markets";
import { fetchQuote } from "./quotes";
import { aboveTarget, priceLabel } from "./format";

const ACCENT = "#d8a34a";
const CHANNEL = "targets";
const TARGET_TASK = "playmarkets-target-check";

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
        name: "Target alerts",
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

// Fires one PlayMarkets-branded notification summarising markets above target.
export async function sendTargetNotification(hits) {
  if (!ready || !hits || !hits.length) return;
  const title = hits.length === 1
    ? `${hits[0].name} is above target`
    : `${hits.length} markets above target`;
  const body = hits
    .map((m) => `${m.name}: ${priceLabel(m.price)} (target ${m.target})`)
    .join("\n");
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, color: ACCENT, sound: true },
      trigger: Platform.OS === "android" ? { channelId: CHANNEL, seconds: 1 } : null,
    });
  } catch (e) {
    console.log("notify failed", e?.message || e);
  }
}

// Refreshes prices and notifies about anything above target. Used by the
// background task (app closed) and can be reused on a foreground interval.
export async function runTargetCheck() {
  await signInShared();
  const list = await getMarketsOnce();
  const hits = [];
  for (const m of list) {
    let cur = m;
    const sym = (m.quote || m.symbol || "").trim();
    if (sym) {
      try {
        const q = await fetchQuote(sym);
        cur = {
          ...m,
          price: String(q.price),
          changeDay: q.changeDay != null ? String(q.changeDay) : "",
          changeWeek: q.changeWeek != null ? String(q.changeWeek) : "",
          changeMonth: q.changeMonth != null ? String(q.changeMonth) : "",
        };
        await saveMarket(cur);
      } catch (e) { /* keep last-known price */ }
    }
    if (aboveTarget(cur)) hits.push(cur);
  }
  await sendTargetNotification(hits);
}

// ---- Background task (runs when the app is closed; not in Expo Go) ----
TaskManager.defineTask(TARGET_TASK, async () => {
  try {
    // Notifications may need setup in the headless context.
    if (!ready) await setupNotifications();
    await runTargetCheck();
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
    const already = await TaskManager.isTaskRegisteredAsync(TARGET_TASK);
    if (!already) {
      await BackgroundTask.registerTaskAsync(TARGET_TASK, { minimumInterval: 240 }); // ~4h (minutes)
    }
  } catch (e) {
    // Not available (e.g. Expo Go) — foreground alerts still work.
    console.log("background alerts unavailable:", e?.message || e);
  }
}
