import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { api, uploadListing } from '@/services/api';
import { Category } from '@/types';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Create() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [cats, setCats] = useState<Category[]>([]);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [busy, setBusy] = useState(false);

  const [v, setV] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    price: '',
    condition: 'good',
    location: '',
  });

  React.useEffect(() => {
    api('/categories')
      .then((b: any) => {
        setCats(b?.data?.categories || []);
      })
      .catch(() => {});
  }, []);

  const set = (key: string, value: string) => {
    setV((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const pick = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access to add listing images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(result.assets.slice(0, 8));
    }
  };

  const publish = async () => {
    if (
      !v.category ||
      !v.title.trim() ||
      !v.description.trim() ||
      !v.price ||
      !v.location.trim()
    ) {
      Alert.alert(
        'Missing details',
        'Please complete the category, title, description, price and location.'
      );
      return;
    }

    const numericPrice = Number(v.price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      Alert.alert(
        'Invalid price',
        'Enter a valid non-negative price.'
      );
      return;
    }

    try {
      setBusy(true);

      const form = new FormData();

      form.append('category', v.category);
      form.append('subcategory', v.subcategory);
      form.append('title', v.title.trim());
      form.append('description', v.description.trim());
      form.append('price', String(numericPrice));
      form.append('condition', v.condition);
      form.append('location', v.location.trim());

      /*
       * IMPORTANT:
       * Expo SDK 57 / React Native requires a supported
       * FormData file implementation.
       *
       * Do NOT append { uri, name, type } directly.
       */
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        if (!image?.uri) {
          continue;
        }

        const file = new File(image.uri);

        form.append('images', file);
      }

      await uploadListing(form);

      Alert.alert(
        'Submitted',
        'Your ad is pending admin approval.',
        [
          {
            text: 'Done',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.log('PUBLISH ERROR:', error);

      Alert.alert(
        'Could not publish',
        error?.message || 'Something went wrong while publishing your ad.'
      );
    } finally {
      setBusy(false);
    }
  };

  const continueNext = () => {
    if (step === 1 && !v.category) {
      Alert.alert(
        'Choose a category',
        'Select a category before continuing.'
      );
      return;
    }

    if (
      step === 2 &&
      (!v.title.trim() ||
        !v.description.trim() ||
        !v.price)
    ) {
      Alert.alert(
        'Missing details',
        'Enter a title, price and description.'
      );
      return;
    }

    if (step === 4 && !v.location.trim()) {
      Alert.alert(
        'Location required',
        'Enter the city or area.'
      );
      return;
    }

    if (step < 4) {
      setStep((prev) => prev + 1);
    } else {
      publish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.header}>
          <Pressable
            onPress={() =>
              step > 1 ? setStep(step - 1) : router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={23}
            />
          </Pressable>

          <Text style={s.h}>Post your ad</Text>

          <Text style={s.step}>
            {step}/4
          </Text>
        </View>

        {step === 1 && (
          <View>
            <Text style={s.p}>
              Choose a category
            </Text>

            {cats.map((category) => (
              <Pressable
                key={category._id}
                onPress={() =>
                  set('category', category._id)
                }
                style={[
                  s.choice,
                  v.category === category._id &&
                    s.choiceActive,
                ]}
              >
                <Text
                  style={[
                    s.choiceText,
                    v.category === category._id && {
                      color: theme.primary,
                    },
                  ]}
                >
                  {category.name}
                </Text>

                <Ionicons
                  name={
                    v.category === category._id
                      ? 'radio-button-on'
                      : 'radio-button-off-outline'
                  }
                  size={20}
                  color={
                    v.category === category._id
                      ? theme.primary
                      : theme.muted
                  }
                />
              </Pressable>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={s.p}>
              Tell buyers about it
            </Text>

            <TextInput
              placeholder="Title"
              value={v.title}
              onChangeText={(value) =>
                set('title', value)
              }
              style={s.input}
            />

            <TextInput
              placeholder="Price"
              keyboardType="numeric"
              value={v.price}
              onChangeText={(value) =>
                set('price', value)
              }
              style={s.input}
            />

            <TextInput
              placeholder="Description"
              multiline
              value={v.description}
              onChangeText={(value) =>
                set('description', value)
              }
              style={[
                s.input,
                {
                  height: 130,
                  textAlignVertical: 'top',
                },
              ]}
            />

            <Text style={s.label}>
              Condition
            </Text>

            <View style={s.pills}>
              {[
                'new',
                'like-new',
                'good',
                'fair',
              ].map((condition) => (
                <Pressable
                  key={condition}
                  onPress={() =>
                    set('condition', condition)
                  }
                  style={[
                    s.pill,
                    v.condition === condition &&
                      s.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      s.pillText,
                      v.condition === condition && {
                        color: '#fff',
                      },
                    ]}
                  >
                    {condition}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={s.p}>
              Add up to 8 photos
            </Text>

            <Pressable
              onPress={pick}
              style={s.addPhoto}
            >
              <Ionicons
                name="camera-outline"
                size={30}
                color={theme.primary}
              />

              <Text
                style={{
                  fontWeight: '800',
                  marginTop: 8,
                }}
              >
                Choose photos
              </Text>

              <Text style={s.meta}>
                Clear photos get more attention.
              </Text>
            </Pressable>

            <View style={s.photos}>
              {images.map((image, index) => (
                <Image
                  key={`${image.uri}-${index}`}
                  source={{ uri: image.uri }}
                  style={s.photo}
                />
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={s.p}>
              Where is it located?
            </Text>

            <TextInput
              placeholder="City / area"
              value={v.location}
              onChangeText={(value) =>
                set('location', value)
              }
              style={s.input}
            />

            <View style={s.preview}>
              <Text style={s.previewTitle}>
                {v.title || 'Your listing title'}
              </Text>

              <Text style={s.previewPrice}>
                ₹
                {Number(
                  v.price || 0
                ).toLocaleString('en-IN')}
              </Text>

              <Text style={s.meta}>
                {v.location || 'Location'} ·{' '}
                {v.condition}
              </Text>

              <Text style={s.desc}>
                {v.description ||
                  'Your description will appear here.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.bottom}>
        <Pressable
          disabled={busy}
          onPress={continueNext}
          style={[
            s.btn,
            busy && { opacity: 0.6 },
          ]}
        >
          <Text style={s.btnText}>
            {busy
              ? 'Publishing…'
              : step < 4
                ? 'Continue'
                : 'Publish ad'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    padding: 18,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  h: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.ink,
  },

  step: {
    fontSize: 12,
    color: theme.muted,
  },

  p: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.ink,
    marginBottom: 16,
  },

  choice: {
    height: 56,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 15,
    paddingHorizontal: 16,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  choiceActive: {
    borderColor: theme.primary,
    backgroundColor: '#F8FAFF',
  },

  choiceText: {
    fontWeight: '800',
  },

  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  label: {
    fontWeight: '800',
    marginBottom: 9,
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: '#fff',
  },

  pillActive: {
    backgroundColor: theme.ink,
    borderColor: theme.ink,
  },

  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  addPhoto: {
    height: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.primary,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  meta: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 5,
  },

  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  photo: {
    width: 92,
    height: 92,
    borderRadius: 12,
  },

  preview: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.line,
    marginTop: 18,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  previewPrice: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },

  desc: {
    color: '#344054',
    lineHeight: 21,
    marginTop: 12,
  },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },

  btn: {
    height: 54,
    borderRadius: 15,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});