import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import Screen from '@/components/Screen';
import CategoryChip from '@/components/CategoryChip';
import ListingCard from '@/components/ListingCard';

import { theme } from '@/constants/theme';

import {
  api,
  SOCKET_URL,
  token,
} from '@/services/api';

import {
  Category,
  Listing,
} from '@/types';

import {
  io,
  Socket,
} from 'socket.io-client';

type NotificationItem = {
  _id: string;
  read: boolean;
};

export default function Home() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    location?: string;
  }>();

  const [cats, setCats] =
    useState<Category[]>([]);

  const [items, setItems] =
    useState<Listing[]>([]);

  const [q, setQ] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
   * =========================================================
   * NOTIFICATION BADGE
   * =========================================================
   */

  const [unreadCount, setUnreadCount] =
    useState(0);

  /*
   * =========================================================
   * LOAD HOME DATA
   * =========================================================
   */

  const load = useCallback(async () => {
    try {
      const [
        categoriesResponse,
        listingsResponse,
      ] = await Promise.all([
        api('/categories'),
        api('/listings?limit=40'),
      ]);

      setCats(
        categoriesResponse.data.categories || []
      );

      setItems(
        listingsResponse.data.items || []
      );
    } catch (error) {
      console.log(
        'Home load error:',
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * =========================================================
   * LOAD UNREAD NOTIFICATION COUNT
   * =========================================================
   */

  const loadUnreadCount =
    useCallback(async () => {
      try {
        const response =
          await api('/notifications');

        const notifications: NotificationItem[] =
          response?.data?.notifications || [];

        const count =
          notifications.filter(
            notification =>
              !notification.read
          ).length;

        setUnreadCount(count);
      } catch (error) {
        console.log(
          'Failed to load notification count:',
          error
        );
      }
    }, []);

  /*
   * =========================================================
   * REFRESH BADGE WHEN HOME GETS FOCUS
   *
   * This is important because:
   *
   * Home
   *   ↓
   * Notification
   *   ↓
   * User opens notification
   *   ↓
   * Notification becomes read
   *   ↓
   * Back to Home
   *   ↓
   * Badge updates
   * =========================================================
   */

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount])
  );

  /*
   * =========================================================
   * REAL-TIME NOTIFICATION
   *
   * If a new notification arrives while the user is on Home,
   * immediately increase the badge.
   * =========================================================
   */

  useEffect(() => {
    let socket: Socket | null = null;

    let mounted = true;

    const connectSocket = async () => {
      try {
        const authToken =
          await token();

        if (
          !authToken ||
          !mounted
        ) {
          return;
        }

        socket = io(
          SOCKET_URL,
          {
            auth: {
              token: authToken,
            },
          }
        );

        socket.on(
          'notification:new',
          notification => {
            if (!mounted) {
              return;
            }

            if (
              !notification ||
              !notification._id
            ) {
              return;
            }

            /*
             * New notifications arrive unread.
             *
             * Increase the badge by 1.
             */

            setUnreadCount(
              current => current + 1
            );
          }
        );

        socket.on(
          'connect_error',
          error => {
            console.log(
              'Notification badge socket error:',
              error.message
            );
          }
        );
      } catch (error) {
        console.log(
          'Failed to connect notification badge socket:',
          error
        );
      }
    };

    connectSocket();

    return () => {
      mounted = false;

      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  /*
   * =========================================================
   * FILTER LISTINGS
   * =========================================================
   */

  const filteredItems = useMemo(() => {
    const searchText =
      q.trim().toLowerCase();

    if (!searchText) {
      return items;
    }

    return items.filter((item: any) => {
      const title =
        String(
          item.title || ''
        ).toLowerCase();

      const location =
        String(
          item.location || ''
        ).toLowerCase();

      const description =
        String(
          item.description || ''
        ).toLowerCase();

      const categoryName =
        String(
          item.category?.name || ''
        ).toLowerCase();

      return (
        title.includes(searchText) ||
        location.includes(searchText) ||
        description.includes(searchText) ||
        categoryName.includes(searchText)
      );
    });
  }, [q, items]);

  /*
   * =========================================================
   * CLEAR SEARCH
   * =========================================================
   */

  const clearSearch = () => {
    setQ('');
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);

        load();

        loadUnreadCount();
      }}
      contentStyle={{
        paddingHorizontal: 16,
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={s.top}>
        <View>
          <Text style={s.logo}>
            marketly
          </Text>

          <Text style={s.sub}>
            Your local marketplace
          </Text>
        </View>

        {/* =================================================
            NOTIFICATION BUTTON
        ================================================= */}

        <Pressable
          onPress={() =>
            router.push(
              '/notifications' as any
            )
          }
          style={s.icon}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={theme.ink}
          />

          {/* ===============================================
              UNREAD BADGE
          =============================================== */}

          {unreadCount > 0 && (
            <View
              style={
                s.notificationBadge
              }
            >
              <Text
                style={
                  s.notificationBadgeText
                }
              >
                {unreadCount > 99
                  ? '99+'
                  : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* =====================================================
          HOME SEARCH
      ===================================================== */}

      <View style={s.search}>
        <Ionicons
          name="search"
          size={20}
          color={theme.muted}
        />

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search cars, phones, furniture…"
          placeholderTextColor={
            theme.muted
          }
          style={s.searchInput}
          returnKeyType="search"
        />

        {q.length > 0 && (
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
          LOCATION
      ===================================================== */}

      <Pressable
        style={s.location}
        onPress={() =>
          router.push(
            '/location-search' as any
          )
        }
      >
        <Ionicons
          name="location-outline"
          size={17}
          color={theme.primary}
        />

        <Text
          style={s.locText}
          numberOfLines={1}
        >
          {params.location ||
            'Choose your location'}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.muted}
        />
      </Pressable>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <Text style={s.section}>
        Explore categories
      </Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        data={cats}
        keyExtractor={item =>
          item._id
        }
        renderItem={({ item }) => (
          <CategoryChip
            name={item.name}
            icon={item.icon}
            onPress={() =>
              router.push({
                pathname: '/search',
                params: {
                  category: item._id,
                },
              } as any)
            }
          />
        )}
      />

      {/* =====================================================
          RECOMMENDATIONS HEADER
      ===================================================== */}

      <View style={s.sectionRow}>
        <View>
          <Text style={s.section}>
            {q.trim()
              ? 'Search results'
              : 'Fresh recommendations'}
          </Text>

          {q.trim() && (
            <Text
              style={s.resultText}
            >
              {filteredItems.length} listing
              {filteredItems.length === 1
                ? ''
                : 's'}{' '}
              found
            </Text>
          )}
        </View>

        {!q.trim() && (
          <Pressable
            onPress={() =>
              router.push(
                '/search' as any
              )
            }
          >
            <Text style={s.more}>
              View all
            </Text>
          </Pressable>
        )}
      </View>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <ActivityIndicator
          size="large"
          style={s.loader}
        />
      ) : (
        <>
          {/* =================================================
              FILTERED LISTINGS
          ================================================= */}

          <View style={s.grid}>
            {filteredItems.map(item => (
              <ListingCard
                key={item._id}
                item={item}
              />
            ))}
          </View>

          {/* =================================================
              EMPTY SEARCH RESULT
          ================================================= */}

          {filteredItems.length === 0 && (
            <View style={s.empty}>
              <Ionicons
                name="search-outline"
                size={46}
                color={theme.muted}
              />

              <Text
                style={s.emptyTitle}
              >
                No listings found
              </Text>

              <Text
                style={s.emptyText}
              >
                Try searching for another
                car, phone, furniture,
                location, or category.
              </Text>

              {q.length > 0 && (
                <Pressable
                  onPress={clearSearch}
                  style={
                    s.clearSearchButton
                  }
                >
                  <Text
                    style={
                      s.clearSearchText
                    }
                  >
                    Clear search
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}

      <View
        style={{
          height: 50,
        }}
      />
    </Screen>
  );
}

const s =
  StyleSheet.create({
    top: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },

    logo: {
      fontSize: 28,
      fontWeight: '900',
      color: theme.primary,
      letterSpacing: -1,
    },

    sub: {
      fontSize: 11,
      color: theme.muted,
      marginTop: 2,
    },

    /* 
     * =======================================================
     * NOTIFICATION ICON
     * =======================================================
     */

    icon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.line,

      /*
       * Needed so the badge can sit
       * outside/over the icon.
       */

      position: 'relative',
    },

    /*
     * =======================================================
     * NOTIFICATION BADGE
     * =======================================================
     */

    notificationBadge: {
      position: 'absolute',

      top: -5,
      right: -5,

      minWidth: 20,
      height: 20,

      paddingHorizontal: 5,

      borderRadius: 10,

      backgroundColor: '#EF4444',

      alignItems: 'center',
      justifyContent: 'center',

      borderWidth: 2,
      borderColor: '#fff',
    },

    notificationBadgeText: {
      color: '#fff',

      fontSize: 10,
      fontWeight: '900',

      textAlign: 'center',
    },

    search: {
      height: 54,
      borderRadius: 16,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: theme.line,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
    },

    searchInput: {
      flex: 1,
      height: '100%',
      marginLeft: 10,
      fontSize: 14,
      color: theme.ink,
    },

    clearButton: {
      padding: 3,
    },

    location: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    locText: {
      flex: 1,
      fontSize: 13,
      color: theme.ink,
      fontWeight: '600',
    },

    section: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.ink,
      marginVertical: 14,
    },

    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    more: {
      color: theme.primary,
      fontWeight: '800',
      fontSize: 12,
    },

    resultText: {
      color: theme.muted,
      fontSize: 12,
      marginTop: -8,
      marginBottom: 8,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
    },

    loader: {
      marginTop: 30,
    },

    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 25,
      marginTop: 45,
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
      lineHeight: 19,
      marginTop: 6,
    },

    clearSearchButton: {
      marginTop: 18,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor:
        theme.primary,
    },

    clearSearchText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '800',
    },
  });