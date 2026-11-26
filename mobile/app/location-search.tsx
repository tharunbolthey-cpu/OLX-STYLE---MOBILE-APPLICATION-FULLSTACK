import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/theme';

type LocationResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

export default function LocationSearch() {
  const router = useRouter();

  const [query, setQuery] =
    useState('');

  const [results, setResults] =
    useState<LocationResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const searchText =
      query.trim();

    if (!searchText) {
      setResults([]);
      setError('');
      return;
    }

    const timer =
      setTimeout(() => {
        searchLocations(searchText);
      }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const searchLocations =
    async (searchText: string) => {
      try {
        setLoading(true);
        setError('');

        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(
            searchText
          )}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=10` +
          `&countrycodes=in`;

        const response =
          await fetch(url, {
            headers: {
              Accept:
                'application/json',
              'User-Agent':
                'Marketly Marketplace App',
            },
          });

        if (!response.ok) {
          throw new Error(
            'Location search failed'
          );
        }

        const data =
          await response.json();

        setResults(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.log(
          'Location search error:',
          err
        );

        setResults([]);

        setError(
          'Unable to search location. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

  const selectLocation =
    (location: LocationResult) => {
      Keyboard.dismiss();

      router.replace({
        pathname: '/(tabs)',
        params: {
          location:
            location.display_name,
        },
      } as any);
    };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <View style={s.container}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={s.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          style={s.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.ink}
          />
        </Pressable>

        <Text style={s.headerTitle}>
          Choose location
        </Text>

        <View style={s.headerSpacer} />
      </View>

      {/* =====================================================
          SEARCH BOX
      ===================================================== */}

      <View style={s.search}>
        <Ionicons
          name="search-outline"
          size={21}
          color={theme.muted}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city, area or locality"
          placeholderTextColor={
            theme.muted
          }
          autoFocus
          returnKeyType="search"
          style={s.input}
        />

        {query.length > 0 && (
          <Pressable
            onPress={clearSearch}
            style={s.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.muted}
            />
          </Pressable>
        )}
      </View>

      {/* =====================================================
          HELPER TEXT
      ===================================================== */}

      {!query.trim() && (
        <View style={s.emptySearch}>
          <View style={s.locationIcon}>
            <Ionicons
              name="location-outline"
              size={28}
              color={theme.primary}
            />
          </View>

          <Text style={s.emptyTitle}>
            Search for a location
          </Text>

          <Text style={s.emptyText}>
            Enter a city, area or locality
            to find your location.
          </Text>

          <View style={s.examples}>
            <Text style={s.examplesTitle}>
              Try searching
            </Text>

            <View style={s.exampleRow}>
              <View style={s.exampleChip}>
                <Text
                  style={s.exampleText}
                >
                  Hyderabad
                </Text>
              </View>

              <View style={s.exampleChip}>
                <Text
                  style={s.exampleText}
                >
                  Nalgonda
                </Text>
              </View>

              <View style={s.exampleChip}>
                <Text
                  style={s.exampleText}
                >
                  Vijayawada
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <View style={s.loading}>
          <ActivityIndicator
            size="small"
            color={theme.primary}
          />

          <Text style={s.loadingText}>
            Searching locations...
          </Text>
        </View>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error ? (
        <View style={s.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={24}
            color={theme.danger}
          />

          <Text style={s.errorText}>
            {error}
          </Text>
        </View>
      ) : null}

      {/* =====================================================
          RESULTS
      ===================================================== */}

      {!loading &&
        query.trim() &&
        results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={item =>
              String(item.place_id)
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              s.resultsContent
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  selectLocation(item)
                }
                style={({ pressed }) => [
                  s.resultItem,
                  pressed &&
                    s.resultPressed,
                ]}
              >
                <View
                  style={
                    s.resultIcon
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={
                      theme.primary
                    }
                  />
                </View>

                <View
                  style={
                    s.resultContent
                  }
                >
                  <Text
                    style={
                      s.resultTitle
                    }
                    numberOfLines={2}
                  >
                    {item.display_name}
                  </Text>

                  <Text
                    style={
                      s.resultSubtitle
                    }
                    numberOfLines={1}
                  >
                    Tap to select
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    theme.muted
                  }
                />
              </Pressable>
            )}
          />
        )}

      {/* =====================================================
          NO RESULTS
      ===================================================== */}

      {!loading &&
        query.trim() &&
        !error &&
        results.length === 0 && (
          <View style={s.noResults}>
            <View style={s.noResultsIcon}>
              <Ionicons
                name="search-outline"
                size={28}
                color={theme.muted}
              />
            </View>

            <Text
              style={s.noResultsTitle}
            >
              No locations found
            </Text>

            <Text
              style={s.noResultsText}
            >
              Try a different city, area or
              locality name.
            </Text>
          </View>
        )}
    </View>
  );
}

const s =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        theme.bg,
      paddingTop: 55,
    },

    header: {
      height: 58,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        theme.card,
      borderWidth: 1,
      borderColor:
        theme.line,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.ink,
    },

    headerSpacer: {
      width: 42,
      height: 42,
    },

    search: {
      height: 54,
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 15,
      borderRadius: 16,
      backgroundColor:
        theme.card,
      borderWidth: 1,
      borderColor:
        theme.line,
      flexDirection: 'row',
      alignItems: 'center',
    },

    input: {
      flex: 1,
      height: '100%',
      marginLeft: 10,
      color: theme.ink,
      fontSize: 14,
      fontWeight: '500',
    },

    clearButton: {
      padding: 3,
    },

    emptySearch: {
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingTop: 70,
    },

    locationIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor:
        theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      marginTop: 18,
      fontSize: 20,
      fontWeight: '900',
      color: theme.ink,
    },

    emptyText: {
      marginTop: 7,
      fontSize: 13,
      lineHeight: 19,
      color: theme.muted,
      textAlign: 'center',
    },

    examples: {
      marginTop: 30,
      width: '100%',
    },

    examplesTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.muted,
      marginBottom: 10,
      textAlign: 'center',
    },

    exampleRow: {
      flexDirection: 'row',
      justifyContent:
        'center',
      flexWrap: 'wrap',
      gap: 8,
    },

    exampleChip: {
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor:
        theme.card,
      borderWidth: 1,
      borderColor:
        theme.line,
    },

    exampleText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.inkSoft,
    },

    loading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 25,
      gap: 9,
    },

    loadingText: {
      fontSize: 13,
      color: theme.muted,
      fontWeight: '600',
    },

    errorBox: {
      marginHorizontal: 16,
      marginTop: 20,
      padding: 15,
      borderRadius: 14,
      backgroundColor:
        theme.dangerLight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    errorText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.danger,
      fontWeight: '600',
    },

    resultsContent: {
      paddingHorizontal: 16,
      paddingTop: 15,
      paddingBottom: 30,
    },

    resultItem: {
      minHeight: 72,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 9,
      borderRadius: 16,
      backgroundColor:
        theme.card,
      borderWidth: 1,
      borderColor:
        theme.line,
      flexDirection: 'row',
      alignItems: 'center',
    },

    resultPressed: {
      opacity: 0.75,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    resultIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    resultContent: {
      flex: 1,
      paddingRight: 8,
    },

    resultTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '800',
      color: theme.ink,
    },

    resultSubtitle: {
      fontSize: 10,
      color: theme.muted,
      marginTop: 4,
      fontWeight: '600',
    },

    noResults: {
      alignItems: 'center',
      paddingHorizontal: 25,
      paddingTop: 70,
    },

    noResultsIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        theme.lineLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    noResultsTitle: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: '900',
      color: theme.ink,
    },

    noResultsText: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: theme.muted,
      textAlign: 'center',
    },
  });