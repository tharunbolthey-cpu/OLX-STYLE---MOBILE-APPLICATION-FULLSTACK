import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={s.brand}>
        <Text style={s.logo}>marketly</Text>
        <Text style={s.tag}>Buy. Sell. Discover.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h}>Welcome back</Text>

        <Text style={s.p}>
          Sign in to continue to your marketplace.
        </Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={s.input}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={s.input}
        />

        <Pressable
          disabled={busy}
          onPress={submit}
          style={s.btn}
        >
          <Text style={s.btnText}>
            {busy ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>

        <View style={s.row}>
          <Text style={s.p}>New here?</Text>

          <Link
            href="/(auth)/register"
            style={s.link}
          >
            {" "}
            Create account
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  brand: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -2,
    color: theme.primary,
  },

  tag: {
    color: theme.muted,
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.line,
  },

  h: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.ink,
  },

  p: {
    color: theme.muted,
    marginTop: 7,
    lineHeight: 20,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginTop: 14,
    fontSize: 15,
    backgroundColor: "#fff",
  },

  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },

  link: {
    color: theme.primary,
    fontWeight: "800",
  },
});