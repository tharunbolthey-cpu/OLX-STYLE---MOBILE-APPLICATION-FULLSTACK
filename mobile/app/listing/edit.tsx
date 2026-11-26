import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Screen from "@/components/Screen";
import { api } from "@/services/api";
import { theme } from "@/constants/theme";

export default function Edit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [v, setV] = useState<any>({
    title: "",
    description: "",
    price: "",
    condition: "good",
    location: "",
  });

  useEffect(() => {
    if (id)
      api(`/listings/${id}`)
        .then((b) => {
          const x = b.data.listing;

          setV({
            title: x.title,
            description: x.description,
            price: String(x.price),
            condition: x.condition,
            location: x.location,
          });
        })
        .catch(() => {});
  }, [id]);

  const save = async () => {
    try {
      await api(`/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(v),
      });

      Alert.alert(
        "Saved",
        "Your updated ad is pending review.",
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <Screen>
      <Text style={s.h}>Edit ad</Text>

      <TextInput
        style={s.input}
        value={v.title}
        onChangeText={(x) =>
          setV({
            ...v,
            title: x,
          })
        }
        placeholder="Title"
      />

      <TextInput
        style={s.input}
        value={v.price}
        onChangeText={(x) =>
          setV({
            ...v,
            price: x,
          })
        }
        keyboardType="numeric"
        placeholder="Price"
      />

      <TextInput
        style={[
          s.input,
          {
            height: 130,
            textAlignVertical: "top",
          },
        ]}
        value={v.description}
        onChangeText={(x) =>
          setV({
            ...v,
            description: x,
          })
        }
        multiline
        placeholder="Description"
      />

      <TextInput
        style={s.input}
        value={v.location}
        onChangeText={(x) =>
          setV({
            ...v,
            location: x,
          })
        }
        placeholder="Location"
      />

      <Pressable
        onPress={save}
        style={s.btn}
      >
        <Text style={s.btnText}>Save changes</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  h: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.ink,
    marginBottom: 18,
  },

  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
  },
});