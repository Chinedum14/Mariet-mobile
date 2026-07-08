import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { colors } from "../theme";
import { checkLogin } from "../auth";
import { useMarkets } from "../MarketsContext";
import { isConfigured } from "../../firebase-config";

export default function LoginScreen({ navigation }) {
  const { start } = useMarkets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError("");
    if (!checkLogin(username.trim(), password)) {
      setError("Incorrect username or password.");
      setPassword("");
      return;
    }
    if (!isConfigured) {
      setError("Firebase isn't configured yet — fill in firebase-config.js.");
      return;
    }
    setBusy(true);
    try {
      await start();
      navigation.replace("Markets");
    } catch (e) {
      setError("Could not connect: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>PLAYMARKETS</Text>
        <Text style={styles.sub}>Sign in to continue</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Username"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.textFaint}
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}

        <Pressable style={styles.button} onPress={onSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#14100a" /> : <Text style={styles.buttonText}>Log in</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: 14, padding: 26,
  },
  brand: { color: colors.accent, fontSize: 16, letterSpacing: 3, fontWeight: "700", textAlign: "center" },
  sub: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 22 },
  label: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#0d0d0f", borderColor: colors.border, borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11, color: colors.text, fontSize: 15, marginBottom: 14,
  },
  error: { color: colors.down, fontSize: 12, minHeight: 18, marginBottom: 8 },
  errorSpacer: { minHeight: 18, marginBottom: 8 },
  button: {
    backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  buttonText: { color: "#14100a", fontWeight: "700", fontSize: 15 },
});
