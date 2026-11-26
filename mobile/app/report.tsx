
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import Screen from "@/components/Screen";
import { api } from "@/services/api";
import { theme } from "@/constants/theme";

export default function Report() {
  const params = useLocalSearchParams<{
    listing?: string | string[];
  }>();

  const router = useRouter();

  const listingId = Array.isArray(params.listing)
    ? params.listing[0]
    : params.listing;

  const [reason, setReason] = useState("Scam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    "Scam",
    "Fake listing",
    "Wrong category",
    "Offensive content",
    "Duplicate listing",
    "Other",
  ];

  const submit = async () => {
    if (!listingId) {
      Alert.alert(
        "Error",
        "The listing ID is missing. Please go back and try again."
      );
      return;
    }

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          listing: listingId,
          reason,
          description: description.trim(),
        }),
      });

      Alert.alert(
        "Report submitted",
        "Thanks for helping keep the marketplace safe.",
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Report submission error:", error);

      Alert.alert(
        "Unable to submit report",
        error?.message ||
          "Something went wrong while submitting the report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={s.h}>
        Report listing
      </Text>

      <Text style={s.p}>
        Tell us what is wrong with this ad.
      </Text>

      {reasons.map((item) => (
        <Pressable
          key={item}
          onPress={() => setReason(item)}
          style={[
            s.reason,
            reason === item && s.active,
          ]}
        >
          <Text style={s.reasonText}>
            {item}
          </Text>
        </Pressable>
      ))}

      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={1000}
        placeholder="Additional details (optional)"
        placeholderTextColor={theme.muted}
        style={[
          s.input,
          {
            height: 110,
            textAlignVertical: "top",
          },
        ]}
      />

      <Text style={s.counter}>
        {description.length}/1000
      </Text>

      <Pressable
        onPress={submit}
        disabled={submitting}
        style={[
          s.btn,
          submitting && s.btnDisabled,
        ]}
      >
        <Text style={s.btnText}>
          {submitting
            ? "Submitting..."
            : "Submit report"}
        </Text>
      </Pressable>
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
    marginVertical: 6,
  },

  reason: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 9,
  },

  active: {
    borderColor: theme.primary,
    backgroundColor: "#F8FAFF",
  },

  reasonText: {
    fontWeight: "800",
    color: theme.ink,
  },

  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "#fff",
    padding: 14,
    marginTop: 15,
    color: theme.ink,
  },

  counter: {
    textAlign: "right",
    color: theme.muted,
    fontSize: 12,
    marginTop: 5,
  },

  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
  },
});

