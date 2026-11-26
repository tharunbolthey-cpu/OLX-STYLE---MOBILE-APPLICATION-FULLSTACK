import React, { useEffect, useState } from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import Screen from "@/components/Screen";

import { api } from "@/services/api";

import { Category } from "@/types";

import { theme } from "@/constants/theme";

import { Ionicons } from "@expo/vector-icons";

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([]);

  const router = useRouter();

  useEffect(() => {
    api("/categories")
      .then((b) => setCats(b.data.categories))
      .catch(() => {});
  }, []);

  return (
    <Screen>
      <Text style={s.h}>Categories</Text>

      <Text style={s.p}>
        Browse the marketplace by what you need.
      </Text>

      {cats.map((c) => (
        <View key={c._id} style={s.card}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/search",
                params: {
                  category: c._id,
                },
              } as any)
            }
            style={s.row}
          >
            <View style={s.circle}>
              <Ionicons
                name={(c.icon as any) || "grid-outline"}
                size={23}
                color={theme.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={s.name}>{c.name}</Text>

              <Text style={s.sub}>
                {c.subcategories
                  ?.slice(0, 4)
                  .join(" · ")}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.muted}
            />
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  h: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.ink,
  },

  p: {
    color: theme.muted,
    marginTop: 5,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.line,
    marginBottom: 11,
    padding: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  name: {
    fontWeight: "800",
    fontSize: 15,
    color: theme.ink,
  },

  sub: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 4,
  },
});