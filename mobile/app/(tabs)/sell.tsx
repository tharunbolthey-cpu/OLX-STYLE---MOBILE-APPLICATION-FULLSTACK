import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "@/components/Screen";
import { theme } from "@/constants/theme";

export default function Sell() {
  const router = useRouter();

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={s.box}>
        <View style={s.icon}>
          <Ionicons
            name="camera-outline"
            size={36}
            color={theme.primary}
          />
        </View>

        <Text style={s.h}>Sell something today</Text>

        <Text style={s.p}>
          Create a polished listing in a few quick steps. Add clear
          photos, honest details and your location.
        </Text>

        <Pressable
          onPress={() => router.push("/listing/create" as any)}
          style={s.btn}
        >
          <Ionicons name="add" size={22} color="#fff" />

          <Text style={s.btnText}>Post an ad</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/my-listings" as any)}
          style={s.secondary}
        >
          <Text style={s.secondaryText}>Manage my ads</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 26,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
  },

  icon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },

  h: {
    fontSize: 26,
    fontWeight: "900",
    color: theme.ink,
    marginTop: 20,
    textAlign: "center",
  },

  p: {
    color: theme.muted,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  btn: {
    height: 54,
    borderRadius: 15,
    backgroundColor: theme.primary,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 22,
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  secondary: {
    height: 50,
    justifyContent: "center",
  },

  secondaryText: {
    color: theme.primary,
    fontWeight: "800",
  },
});