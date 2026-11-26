import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Screen from "@/components/Screen";
import ListingCard from "@/components/ListingCard";
import { api } from "@/services/api";
import { Listing } from "@/types";
import { theme } from "@/constants/theme";

export default function Favorites() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api("/favorites")
      .then((b) =>
        setItems(
          (b.data.favorites || []).map((x: any) => x.listing)
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Text
        style={{
          fontSize: 30,
          fontWeight: "900",
          color: theme.ink,
        }}
      >
        Favorites
      </Text>

      <Text
        style={{
          color: theme.muted,
          marginTop: 5,
          marginBottom: 20,
        }}
      >
        The ads you want to keep close.
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {items.map((x) => (
            <ListingCard
              key={x._id}
              item={x}
            />
          ))}
        </View>
      )}

      {!loading && !items.length && (
        <View
          style={{
            padding: 30,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "800" }}>
            No favorites yet
          </Text>

          <Text
            style={{
              color: theme.muted,
              marginTop: 6,
            }}
          >
            Tap the heart on an ad to save it.
          </Text>
        </View>
      )}
    </Screen>
  );
}