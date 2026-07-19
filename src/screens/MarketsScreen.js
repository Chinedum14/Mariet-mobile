import React, { useEffect, useLayoutEffect, useMemo } from "react";
import {
  View, Text, SectionList, Pressable, StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { colors } from "../theme";
import { useMarkets } from "../MarketsContext";
import { changeInfo, aboveTarget, hasMomentum } from "../format";

function groupByCategory(markets) {
  const groups = {};
  for (const m of markets) {
    const key = (m.category || "Other").trim() || "Other";
    (groups[key] ||= []).push(m);
  }
  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((title) => ({
      title,
      data: groups[title].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    }));
}

export default function MarketsScreen({ navigation }) {
  const { markets, refreshing, refreshQuotes } = useMarkets();
  const sections = useMemo(() => groupByCategory(markets), [markets]);

  // Pull live prices once when the list first appears.
  useEffect(() => { refreshQuotes(); }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerBtns}>
          <Pressable onPress={refreshQuotes} hitSlop={10} style={styles.headerBtn}>
            <Text style={styles.headerIcon}>↻</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("EditMarket", {})} hitSlop={10} style={styles.headerBtn}>
            <Text style={[styles.headerIcon, { color: colors.accent }]}>＋</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, refreshQuotes]);

  if (!markets.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No markets yet</Text>
        <Text style={styles.emptySub}>Add a market to start tracking prices and notes.</Text>
        <Pressable style={styles.primary} onPress={() => navigation.navigate("EditMarket", {})}>
          <Text style={styles.primaryText}>＋ Add a market</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.list}
      sections={sections}
      keyExtractor={(m) => m.id}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshQuotes} tintColor={colors.accent} />
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.groupLabel}>{section.title.toUpperCase()}</Text>
      )}
      renderItem={({ item: m }) => {
        const ci = changeInfo(m.changeDay);
        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => navigation.navigate("Editor", { id: m.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{m.name}</Text>
              <View style={styles.ticker}>
                {m.symbol ? <Text style={styles.tickerSym}>{m.symbol}</Text> : null}
                {hasMomentum(m) ? <View style={styles.momentumDot} /> : null}
                <Text style={{ color: ci.color, fontSize: 11 }}>{ci.arrow}</Text>
                {ci.pct ? <Text style={{ color: ci.color, fontSize: 11 }}>{ci.pct}</Text> : null}
              </View>
            </View>
            {aboveTarget(m) ? <View style={styles.marker} /> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  headerBtns: { flexDirection: "row", gap: 18, paddingRight: 4 },
  headerBtn: { paddingHorizontal: 2 },
  headerIcon: { color: colors.textDim, fontSize: 20 },
  groupLabel: {
    color: colors.textFaint, fontSize: 11, letterSpacing: 1.4,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 11, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  rowPressed: { backgroundColor: colors.rowActive },
  rowName: { color: colors.text, fontSize: 16 },
  ticker: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  tickerSym: { color: colors.textMuted, fontSize: 11 },
  marker: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: colors.up,
    shadowColor: colors.up, shadowOpacity: 0.8, shadowRadius: 4, marginLeft: 10,
  },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptySub: { color: colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 22 },
  primary: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  primaryText: { color: "#14100a", fontWeight: "700" },
});
