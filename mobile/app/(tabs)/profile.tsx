import React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/constants/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const actions = [
    ["My Ads", "list-outline", "/my-listings"],
    ["Favorites", "heart-outline", "/(tabs)/favorites"],
    ["Notifications", "notifications-outline", "/notifications"],
    ["Settings", "settings-outline", "/settings"],
  ];

  return (
    <Screen>
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.name?.slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <Text style={s.name}>{user?.name}</Text>

        <Text style={s.email}>{user?.email}</Text>

        <Text style={s.member}>
          Member since{" "}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "recently"}
        </Text>
      </View>

      <View style={s.card}>
        {actions.map(([label, icon, path]) => (
          <Pressable
            key={label}
            onPress={() => router.push(path as any)}
            style={s.row}
          >
            <Ionicons
              name={icon as any}
              size={21}
              color={theme.ink}
            />

            <Text style={s.label}>{label}</Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.muted}
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() =>
          Alert.alert(
            "Log out",
            "Are you sure?",
            [
              {
                text: "Cancel",
              },
              {
                text: "Log out",
                style: "destructive",
                onPress: logout,
              },
            ]
          )
        }
        style={s.logout}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color={theme.danger}
        />

        <Text
          style={{
            color: theme.danger,
            fontWeight: "800",
          }}
        >
          Log out
        </Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 20,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: theme.primary,
  },

  name: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.ink,
    marginTop: 12,
  },

  email: {
    color: theme.muted,
    marginTop: 4,
  },

  member: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 7,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
  },

  row: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },

  label: {
    flex: 1,
    marginLeft: 14,
    fontWeight: "700",
    color: theme.ink,
  },

  logout: {
    marginTop: 20,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
});