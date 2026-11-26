import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Listing } from '@/types';
import { useFavorites } from '@/context/FavoritesContext';
import { useRouter } from 'expo-router';
import { getImageUrl } from '@/services/api';

export default function ListingCard({
  item,
}: {
  item: Listing;
}) {
  const router = useRouter();

  const { ids, toggle } = useFavorites();

  const fav = ids.has(item._id);

  const imageUrl = getImageUrl(item.images?.[0]);

  return (
    <Pressable
      onPress={() =>
        router.push(`/listing/${item._id}` as any)
      }
      style={({ pressed }) => [
        s.card,
        pressed && s.cardPressed,
      ]}
    >
      <View style={s.imageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={s.placeholder}>
            <Ionicons
              name="image-outline"
              size={24}
              color="#98A2B3"
            />

            <Text style={s.placeholderText}>
              No image
            </Text>
          </View>
        )}

        <View style={s.imageOverlay} />

        <Pressable
          hitSlop={10}
          onPress={() => toggle(item._id)}
          style={s.heart}
        >
          <Ionicons
            name={
              fav
                ? 'heart'
                : 'heart-outline'
            }
            size={15}
            color={
              fav
                ? theme.danger
                : theme.ink
            }
          />
        </Pressable>

        <View style={s.conditionBadge}>
          <View style={s.conditionDot} />

          <Text style={s.conditionText}>
            {item.condition || 'Good'}
          </Text>
        </View>
      </View>

      <View style={s.body}>
        <Text
          numberOfLines={1}
          style={s.title}
        >
          {item.title}
        </Text>

        <Text style={s.price}>
          ₹{Number(item.price).toLocaleString('en-IN')}
        </Text>

        <View style={s.metaRow}>
          <Ionicons
            name="location-outline"
            size={11}
            color={theme.muted}
          />

          <Text
            numberOfLines={1}
            style={s.meta}
          >
            {item.location}
          </Text>
        </View>

        <View style={s.bottomRow}>
          <Text style={s.date}>
            {new Date(
              item.createdAt
            ).toLocaleDateString()}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={12}
            color="#98A2B3"
          />
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',

    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 9,

    elevation: 2,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  imageWrap: {
    height: 140,
    backgroundColor: '#F2F4F7',
    position: 'relative',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4F7',
  },

  placeholderText: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    color: '#98A2B3',
  },

  heart: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,

    elevation: 2,
  },

  conditionBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    height: 21,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },

  conditionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#12B76A',
    marginRight: 4,
  },

  conditionText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#344054',
    textTransform: 'capitalize',
  },

  body: {
    padding: 10,
    paddingBottom: 8,
  },

  title: {
    fontSize: 12.5,
    fontWeight: '800',
    color: theme.ink,
    lineHeight: 16,
  },

  price: {
    fontSize: 15.5,
    fontWeight: '900',
    color: theme.primary,
    marginTop: 4,
    letterSpacing: -0.2,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  meta: {
    flex: 1,
    fontSize: 10,
    color: theme.muted,
    marginLeft: 3,
    fontWeight: '600',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },

  date: {
    fontSize: 9,
    color: '#98A2B3',
    fontWeight: '600',
  },
});