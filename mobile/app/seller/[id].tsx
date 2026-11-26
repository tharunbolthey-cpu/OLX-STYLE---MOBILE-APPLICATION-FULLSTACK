import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "@/components/Screen";
import ListingCard from "@/components/ListingCard";
import { api } from "@/services/api";
import { theme } from "@/constants/theme";

export default function Seller() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<any>();

  useEffect(() => {
    api(`/users/seller/${id}`)
      .then((b) => setData(b.data))
      .catch(() => {});
  }, [id]);

  if (!data)
    return (
      <Screen>
        <Text>Loading…</Text>
      </Screen>
    );

  return (
    <Screen>
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avText}>
            {data.seller.name.slice(0, 1)}
          </Text>
        </View>

        <Text style={s.name}>
          {data.seller.name}
        </Text>

        <Text style={s.meta}>
          {data.seller.location || "Local seller"}
        </Text>

        <Text style={s.meta}>
          Member since{" "}
          {new Date(
            data.seller.createdAt
          ).toLocaleDateString()}
        </Text>
      </View>

      <Text style={s.h}>Active ads</Text>

      <View style={s.grid}>
        {data.listings.map((x: any) => (
          <ListingCard
            key={x._id}
            item={x}
          />
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avText: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.primary,
  },

  name: {
    fontSize: 23,
    fontWeight: "900",
    marginTop: 10,
  },

  meta: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 5,
  },

  h: {
    fontSize: 19,
    fontWeight: "900",
    marginVertical: 15,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});