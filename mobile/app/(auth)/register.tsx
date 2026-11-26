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

export default function Register() {
  const { register } = useAuth();

  const [v, setV] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [busy, setBusy] = useState(false);

  const set = (k: string, x: string) => setV({ ...v, [k]: x });

  const submit = async () => {
    try {
      setBusy(true);
      await register(v);
    } catch (e: any) {
      Alert.alert("Registration failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ paddingTop: 30 }}>
        <Text style={s.logo}>marketly</Text>

        <Text style={s.h}>Create your account</Text>

        <Text style={s.p}>
          Join a safer, simpler local marketplace.
        </Text>

        <View style={s.card}>
          {[
            ["name", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["password", "Password"],
            ["confirmPassword", "Confirm password"],
          ].map(([k, p]) => (
            <TextInput
              key={k}
              placeholder={p}
              value={(v as any)[k]}
              onChangeText={(x) => set(k, x)}
              secureTextEntry={k.includes("password")}
              keyboardType={
                k === "email"
                  ? "email-address"
                  : k === "phone"
                    ? "phone-pad"
                    : "default"
              }
              autoCapitalize={
                k === "email" ? "none" : "sentences"
              }
              style={s.input}
            />
          ))}

          <Pressable
            disabled={busy}
            onPress={submit}
            style={s.btn}
          >
            <Text style={s.btnText}>
              {busy ? "Creating…" : "Create account"}
            </Text>
          </Pressable>

          <View style={s.row}>
            <Text style={s.p}>Already have an account?</Text>

            <Link
              href="/(auth)/login"
              style={s.link}
            >
              {" "}
              Sign in
            </Link>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: theme.primary,
  },

  h: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.ink,
    marginTop: 24,
  },

  p: {
    color: theme.muted,
    marginTop: 6,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 22,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.line,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  btnText: {
    color: "#fff",
    fontWeight: "800",
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