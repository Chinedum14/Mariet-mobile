import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { colors } from "../theme";
import { useMarkets } from "../MarketsContext";
import { changeInfo, priceLabel, aboveTarget } from "../format";

export default function EditorScreen({ navigation, route }) {
  const { id } = route.params;
  const { markets, saveMarket, deleteMarket } = useMarkets();
  const m = markets.find((x) => x.id === id);

  const [body, setBody] = useState(m?.body || "");
  const timer = useRef(null);
  const latest = useRef({ m, body });
  latest.current = { m, body };

  // If the market disappears (deleted elsewhere), leave the screen.
  useEffect(() => {
    if (!m) navigation.goBack();
  }, [m]);

  const flush = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const cur = latest.current;
    if (cur.m && cur.m.body !== cur.body) saveMarket({ ...cur.m, body: cur.body });
  };
  useEffect(() => () => flush(), []); // flush on unmount

  const onChangeBody = (t) => {
    setBody(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };

  const onDelete = () => {
    Alert.alert("Delete market", `Delete "${m?.name}" and its notes?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteMarket(id); navigation.goBack(); } },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: m?.name || "",
      headerRight: () => (
        <View style={styles.headerBtns}>
          <Pressable onPress={() => navigation.navigate("EditMarket", { id })} hitSlop={10}>
            <Text style={styles.headerAction}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={10}>
            <Text style={[styles.headerAction, { color: colors.down }]}>Delete</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, m?.name, id]);

  if (!m) return <View style={styles.screen} />;

  const horizons = [
    ["1D", m.changeDay],
    ["1W", m.changeWeek],
    ["1M", m.changeMonth],
  ].filter(([, v]) => v !== "" && v != null);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.metaWrap}>
        <View style={styles.metaRow}>
          {m.symbol ? <Text style={styles.metaSym}>{m.symbol}</Text> : null}
          {m.category ? <Text style={styles.metaCat}>· {m.category}</Text> : null}
          {priceLabel(m.price) ? <Text style={styles.metaPrice}>· {priceLabel(m.price)}</Text> : null}
        </View>
        <View style={styles.changesRow}>
          {horizons.map(([label, v]) => {
            const ci = changeInfo(v);
            return (
              <Text key={label} style={{ color: ci.color, fontSize: 12 }}>
                <Text style={styles.chgLabel}>{label} </Text>{ci.arrow} {ci.pct}
              </Text>
            );
          })}
          {m.target ? (
            <Text style={{ color: aboveTarget(m) ? colors.up : colors.textMuted, fontSize: 12 }}>
              {aboveTarget(m) ? "● " : "⌖ "}target {m.target}
            </Text>
          ) : null}
        </View>
      </View>

      <TextInput
        style={styles.notes}
        value={body}
        onChangeText={onChangeBody}
        onBlur={flush}
        multiline
        textAlignVertical="top"
        placeholder="Start typing your notes — research, key levels, current events…"
        placeholderTextColor={colors.textFaint}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerBtns: { flexDirection: "row", gap: 16, paddingRight: 4 },
  headerAction: { color: colors.textDim, fontSize: 14 },
  metaWrap: {
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaSym: { color: colors.textDim, fontSize: 12 },
  metaCat: { color: colors.textMuted, fontSize: 12 },
  metaPrice: { color: colors.text, fontSize: 12 },
  changesRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8, flexWrap: "wrap" },
  chgLabel: { color: colors.textFaint, fontSize: 10 },
  notes: {
    flex: 1, color: colors.notes, fontSize: 15, lineHeight: 24,
    paddingHorizontal: 18, paddingVertical: 16,
  },
});
