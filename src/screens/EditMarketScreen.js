import React, { useLayoutEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { colors } from "../theme";
import { useMarkets } from "../MarketsContext";

function Field({ label, hint, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{hint ? <Text style={styles.hint}>  {hint}</Text> : null}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function EditMarketScreen({ navigation, route }) {
  const editingId = route.params?.id || null;
  const { markets, createMarket, saveMarket, refreshQuotes } = useMarkets();
  const existing = editingId ? markets.find((x) => x.id === editingId) : null;

  const [name, setName] = useState(existing?.name || "");
  const [symbol, setSymbol] = useState(existing?.symbol || "");
  const [quote, setQuote] = useState(existing?.quote || "");
  const [category, setCategory] = useState(existing?.category || "");
  const [target, setTarget] = useState(existing?.target || "");
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Please enter a market name."); return; }
    setBusy(true);
    try {
      const fields = {
        name: name.trim(), symbol: symbol.trim(), quote: quote.trim(),
        category: category.trim(), target: target.trim().replace(/^\$/, ""),
      };
      if (editingId && existing) {
        await saveMarket({ ...existing, ...fields });
      } else {
        await createMarket(fields);
      }
      refreshQuotes();
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not save", String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editingId ? "Edit market" : "Add market",
      headerRight: () => (
        <Pressable onPress={onSave} hitSlop={10} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.save}>Save</Text>}
        </Pressable>
      ),
    });
  }, [navigation, name, symbol, quote, category, target, busy]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Crude Oil" />
      <Field label="Symbol" value={symbol} onChangeText={setSymbol} placeholder="e.g. CL" />
      <Field
        label="Yahoo symbol" hint="for live prices, e.g. CL=F, GC=F, AAPL"
        value={quote} onChangeText={setQuote} placeholder="e.g. CL=F"
      />
      <Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Energy" />
      <Field
        label="Target price" hint="optional; alerts when price rises above it"
        value={target} onChangeText={setTarget} placeholder="e.g. 4000" keyboardType="decimal-pad"
      />
      <Text style={styles.note}>
        Price and day/week/month change are fetched live from Yahoo Finance.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18 },
  field: { marginBottom: 16 },
  label: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  hint: { color: colors.textFaint, fontSize: 11 },
  input: {
    backgroundColor: "#0d0d0f", borderColor: colors.border, borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11, color: colors.text, fontSize: 15,
  },
  save: { color: colors.accent, fontSize: 15, fontWeight: "700", paddingRight: 4 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
