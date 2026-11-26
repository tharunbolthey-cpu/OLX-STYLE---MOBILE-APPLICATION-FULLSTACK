import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Screen from '@/components/Screen';
import ListingCard from '@/components/ListingCard';
import { api } from '@/services/api';
import { Listing } from '@/types';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Search() {
  const params = useLocalSearchParams<{
    category?: string;
    q?: string;
  }>();

  const [q, setQ] = useState(params.q || '');
  const [items, setItems] = useState<Listing[]>([]);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);

  const search = async (searchText = q) => {
    setLoading(true);

    try {
      const query = new URLSearchParams();

      const text = searchText.trim();

      if (text) {
        query.set('q', text);
      }

      if (params.category) {
        query.set('category', params.category);
      }

      query.set('sort', sort);
      query.set('limit', '40');

      const response = await api(
        `/listings?${query.toString()}`
      );

      setItems(response.data.items || []);
    } catch (error) {
      console.log('Search error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load listings when:
   * - category changes
   * - sort changes
   */
  useEffect(() => {
    search();
  }, [params.category, sort]);

  /*
   * Automatically search while typing.
   *
   * The timeout prevents an API request for
   * every single keystroke.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      search(q);
    }, 400);

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <Screen>
      <Text style={styles.heading}>
        Search marketplace
      </Text>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="search"
          size={20}
          color={theme.muted}
        />

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="What are you looking for?"
          placeholderTextColor={theme.muted}
          style={styles.input}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => search(q)}
        />

        {q.length > 0 && (
          <Pressable
            onPress={() => setQ('')}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.muted}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.sorts}>
        {[
          ['newest', 'Newest'],
          ['low', 'Price ↑'],
          ['high', 'Price ↓'],
        ].map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setSort(value)}
            style={[
              styles.pill,
              sort === value && styles.activePill,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                sort === value && styles.activePillText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <ListingCard
              key={item._id}
              item={item}
            />
          ))}
        </View>
      )}

      {!loading && items.length === 0 && (
        <View style={styles.empty}>
          <Ionicons
            name="search-outline"
            size={42}
            color={theme.muted}
          />

          <Text style={styles.emptyTitle}>
            No listings found
          </Text>

          <Text style={styles.emptyText}>
            Try searching for another product, category,
            or location.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.ink,
    marginBottom: 16,
  },

  inputWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: theme.ink,
  },

  clearButton: {
    padding: 3,
  },

  sorts: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },

  pill: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },

  activePill: {
    backgroundColor: theme.ink,
    borderColor: theme.ink,
  },

  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.ink,
  },

  activePillText: {
    color: '#fff',
  },

  loader: {
    marginTop: 30,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  empty: {
    alignItems: 'center',
    marginTop: 45,
    paddingHorizontal: 25,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.ink,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 13,
    color: theme.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
});