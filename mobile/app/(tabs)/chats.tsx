import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import {
  io,
  Socket,
} from 'socket.io-client';

import Screen from '@/components/Screen';

import {
  api,
  SOCKET_URL,
  token,
} from '@/services/api';

import {
  Conversation,
} from '@/types';

import {
  theme,
} from '@/constants/theme';

/*
 * ===========================================================
 * NOTIFICATION TYPE
 * ===========================================================
 */

type NotificationItem = {
  _id: string;

  read: boolean;

  type?: string;

  conversationId?: string;

  data?: {
    conversationId?: string;
  };
};

/*
 * ===========================================================
 * GET CONVERSATION ID FROM NOTIFICATION
 * ===========================================================
 */

function getConversationId(
  notification: NotificationItem
) {
  return (
    notification.data
      ?.conversationId ||
    notification.conversationId ||
    ''
  );
}

/*
 * ===========================================================
 * CHECK MESSAGE NOTIFICATION
 * ===========================================================
 */

function isMessageNotification(
  notification: NotificationItem
) {
  const type =
    String(
      notification.type || ''
    ).toLowerCase();

  return (
    type === 'message' ||
    type === 'chat' ||
    type === 'new_message'
  );
}

/*
 * ===========================================================
 * CHAT SCREEN
 * ===========================================================
 */

export default function Chats() {
  const [
    items,
    setItems,
  ] = useState<Conversation[]>([]);

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const router =
    useRouter();

  /*
   * =========================================================
   * LOAD CONVERSATIONS
   * =========================================================
   */

  const loadConversations =
    useCallback(async () => {
      try {
        const response =
          await api(
            "/conversations"
          );

        setItems(
          response.data.conversations
        );
      } catch (error) {
        console.log(
          'Failed to load conversations:',
          error
        );
      }
    }, []);

  /*
   * =========================================================
   * LOAD NOTIFICATIONS
   * =========================================================
   */

  const loadNotifications =
    useCallback(async () => {
      try {
        const response =
          await api(
            "/notifications"
          );

        const notificationList =
          response?.data
            ?.notifications || [];

        setNotifications(
          Array.isArray(
            notificationList
          )
            ? notificationList
            : []
        );
      } catch (error) {
        console.log(
          'Failed to load chat notifications:',
          error
        );
      }
    }, []);

  /*
   * =========================================================
   * LOAD DATA
   * =========================================================
   */

  const load =
    useCallback(async () => {
      try {
        await Promise.all([
          loadConversations(),
          loadNotifications(),
        ]);
      } finally {
        setLoading(false);
      }
    }, [
      loadConversations,
      loadNotifications,
    ]);

  /*
   * =========================================================
   * LOAD WHEN CHAT SCREEN GETS FOCUS
   * =========================================================
   *
   * This is important.
   *
   * When the user opens a chat and comes back,
   * unread counts are refreshed from the backend.
   */

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /*
   * =========================================================
   * SOCKET.IO
   * =========================================================
   */

  useEffect(() => {
    let socket: Socket | null =
      null;

    let mounted = true;

    const connectSocket =
      async () => {
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

          /*
           * -------------------------------------------------
           * NEW NOTIFICATION
           * -------------------------------------------------
           */

          socket.on(
            'notification:new',
            (
              notification: NotificationItem
            ) => {
              if (!mounted) {
                return;
              }

              if (
                !notification ||
                !notification._id
              ) {
                return;
              }

              if (
                !isMessageNotification(
                  notification
                )
              ) {
                return;
              }

              /*
               * Add notification locally.
               *
               * Prevent duplicate IDs.
               */

              setNotifications(
                current => {
                  const exists =
                    current.some(
                      item =>
                        item._id ===
                        notification._id
                    );

                  if (exists) {
                    return current;
                  }

                  return [
                    notification,
                    ...current,
                  ];
                }
              );

              /*
               * Refresh conversations so
               * latest message is displayed.
               */

              loadConversations();
            }
          );

          /*
           * -------------------------------------------------
           * NEW MESSAGE
           * -------------------------------------------------
           */

          socket.on(
            'message:new',
            () => {
              if (!mounted) {
                return;
              }

              loadConversations();

              loadNotifications();
            }
          );

          socket.on(
            'connect_error',
            error => {
              console.log(
                'Chats socket error:',
                error.message
              );
            }
          );
        } catch (error) {
          console.log(
            'Failed to connect chats socket:',
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
  }, [
    loadConversations,
    loadNotifications,
  ]);

  /*
   * =========================================================
   * UNREAD COUNT BY CONVERSATION
   * =========================================================
   *
   * Example:
   *
   * conversation A = 3
   * conversation B = 1
   * conversation C = 5
   *
   * Result:
   *
   * {
   *   "conversationA": 3,
   *   "conversationB": 1,
   *   "conversationC": 5
   * }
   */

  const unreadByConversation =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      notifications.forEach(
        notification => {
          if (
            notification.read
          ) {
            return;
          }

          if (
            !isMessageNotification(
              notification
            )
          ) {
            return;
          }

          const conversationId =
            getConversationId(
              notification
            );

          if (
            !conversationId
          ) {
            return;
          }

          counts[
            conversationId
          ] =
            (counts[
              conversationId
            ] || 0) + 1;
        }
      );

      return counts;
    }, [notifications]);

  /*
   * =========================================================
   * TOTAL UNREAD MESSAGES
   * =========================================================
   */

  const totalUnread =
    useMemo(() => {
      return Object.values(
        unreadByConversation
      ).reduce(
        (
          total,
          count
        ) => total + count,
        0
      );
    }, [
      unreadByConversation,
    ]);

  /*
   * =========================================================
   * MARK CONVERSATION NOTIFICATIONS AS READ
   * =========================================================
   */

  const markConversationAsRead =
    useCallback(
      async (
        conversationId: string
      ) => {
        /*
         * Find all unread message notifications
         * for this conversation.
         */

        const unread =
          notifications.filter(
            notification => {
              return (
                !notification.read &&
                isMessageNotification(
                  notification
                ) &&
                getConversationId(
                  notification
                ) ===
                  conversationId
              );
            }
          );

        /*
         * Immediately update the UI.
         *
         * This makes the badge disappear
         * without waiting for the API.
         */

        if (
          unread.length > 0
        ) {
          setNotifications(
            current =>
              current.map(
                notification => {
                  if (
                    isMessageNotification(
                      notification
                    ) &&
                    getConversationId(
                      notification
                    ) ===
                      conversationId
                  ) {
                    return {
                      ...notification,
                      read: true,
                    };
                  }

                  return notification;
                }
              )
          );
        }

        /*
         * Persist each notification as read.
         */

        await Promise.all(
          unread.map(
            async notification => {
              try {
                await api(
                  `/notifications/${notification._id}/read`,
                  {
                    method: 'PUT',
                  }
                );
              } catch (error) {
                console.log(
                  'Failed to mark notification as read:',
                  error
                );
              }
            }
          )
        );
      },
      [
        notifications,
      ]
    );

  /*
   * =========================================================
   * OPEN CHAT
   * =========================================================
   */

  const openChat =
    useCallback(
      async (
        conversationId: string
      ) => {
        await markConversationAsRead(
          conversationId
        );

        router.push(
          `/chat/${conversationId}` as any
        );
      },
      [
        markConversationAsRead,
        router,
      ]
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <Screen>
      {/* ===================================================
          HEADER
      =================================================== */}

      <View
        style={s.header}
      >
        <View>
          <Text style={s.h}>
            Chats
          </Text>

          <Text style={s.p}>
            Talk directly with buyers and sellers.
          </Text>
        </View>

        {/* =================================================
            TOTAL MESSAGE BADGE
        ================================================= */}

        {totalUnread > 0 && (
          <View
            style={
              s.totalBadge
            }
          >
            <Text
              style={
                s.totalBadgeText
              }
            >
              {totalUnread > 99
                ? '99+'
                : totalUnread}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        items.map(c => {
          /*
           * -----------------------------------------------
           * GET UNREAD COUNT FOR THIS CHAT
           * -----------------------------------------------
           */

          const unreadCount =
            unreadByConversation[
              c._id
            ] || 0;

          return (
            <Pressable
              key={c._id}
              onPress={() =>
                openChat(
                  c._id
                )
              }
              style={[
                s.card,

                unreadCount > 0 &&
                  s.unreadCard,
              ]}
            >
              {/* =============================================
                  AVATAR
              ============================================= */}

              <View
                style={[
                  s.avatar,

                  unreadCount > 0 &&
                    s.unreadAvatar,
                ]}
              >
                <Text
                  style={
                    s.avatarText
                  }
                >
                  {(
                    c.listing
                      ?.title ||
                    "?"
                  )
                    .slice(0, 1)
                    .toUpperCase()}
                </Text>
              </View>

              {/* =============================================
                  CHAT CONTENT
              ============================================= */}

              <View
                style={{
                  flex: 1,
                }}
              >
                <View
                  style={
                    s.titleRow
                  }
                >
                  <Text
                    style={[
                      s.title,

                      unreadCount >
                        0 &&
                        s.unreadTitle,
                    ]}
                    numberOfLines={
                      1
                    }
                  >
                    {c.listing
                      ?.title ||
                      "Listing"}
                  </Text>

                  {/* =======================================
                      INDIVIDUAL CHAT BADGE
                  ======================================= */}

                  {unreadCount >
                    0 && (
                    <View
                      style={
                        s.unreadBadge
                      }
                    >
                      <Text
                        style={
                          s.unreadBadgeText
                        }
                      >
                        {unreadCount >
                        99
                          ? '99+'
                          : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  numberOfLines={
                    1
                  }
                  style={[
                    s.msg,

                    unreadCount >
                      0 &&
                      s.unreadMsg,
                  ]}
                >
                  {c.lastMessage ||
                    "Start the conversation"}
                </Text>
              </View>

              {/* =============================================
                  DATE
              ============================================= */}

              <Text
                style={s.date}
              >
                {new Date(
                  c.updatedAt
                ).toLocaleDateString()}
              </Text>
            </Pressable>
          );
        })
      )}

      {/* ===================================================
          EMPTY STATE
      =================================================== */}

      {!loading &&
        !items.length && (
          <View
            style={{
              padding: 40,
              alignItems:
                "center",
            }}
          >
            <Text
              style={{
                fontWeight:
                  "800",
              }}
            >
              No conversations
            </Text>

            <Text
              style={{
                color:
                  theme.muted,
                marginTop: 5,
              }}
            >
              Start a chat from any listing.
            </Text>
          </View>
        )}
    </Screen>
  );
}

/*
 * ===========================================================
 * STYLES
 * ===========================================================
 */

const s =
  StyleSheet.create({
    header: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      marginBottom: 20,
    },

    h: {
      fontSize: 30,
      fontWeight: "900",
      color: theme.ink,
    },

    p: {
      color: theme.muted,
      marginTop: 5,
    },

    /*
     * =======================================================
     * TOTAL UNREAD BADGE
     * =======================================================
     */

    totalBadge: {
      minWidth: 28,
      height: 28,
      paddingHorizontal: 7,
      borderRadius: 14,

      backgroundColor:
        "#EF4444",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 3,
    },

    totalBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "900",
    },

    /*
     * =======================================================
     * CHAT CARD
     * =======================================================
     */

    card: {
      backgroundColor: "#fff",

      borderWidth: 1,

      borderColor:
        theme.line,

      borderRadius: 18,

      padding: 14,

      flexDirection:
        "row",

      alignItems:
        "center",

      marginBottom: 10,
    },

    /*
     * =======================================================
     * UNREAD CHAT CARD
     * =======================================================
     */

    unreadCard: {
      borderColor:
        "#D6E4FF",

      backgroundColor:
        "#F8FAFF",
    },

    /*
     * =======================================================
     * AVATAR
     * =======================================================
     */

    avatar: {
      width: 46,
      height: 46,

      borderRadius: 23,

      backgroundColor:
        "#EEF4FF",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 12,
    },

    unreadAvatar: {
      backgroundColor:
        "#E5EDFF",
    },

    avatarText: {
      fontWeight: "900",
      color: theme.primary,
    },

    /*
     * =======================================================
     * TITLE ROW
     * =======================================================
     */

    titleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginBottom: 2,

      paddingRight: 8,
    },

    title: {
      flex: 1,

      fontWeight:
        "800",

      color:
        theme.ink,
    },

    unreadTitle: {
      fontWeight:
        "900",
    },

    /*
     * =======================================================
     * LAST MESSAGE
     * =======================================================
     */

    msg: {
      fontSize: 12,

      color:
        theme.muted,

      marginTop: 4,
    },

    unreadMsg: {
      color:
        theme.ink,

      fontWeight:
        "700",
    },

    /*
     * =======================================================
     * INDIVIDUAL UNREAD BADGE
     * =======================================================
     */

    unreadBadge: {
      minWidth: 21,
      height: 21,

      paddingHorizontal: 6,

      borderRadius: 11,

      backgroundColor:
        "#EF4444",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginLeft: 7,
    },

    unreadBadgeText: {
      color:
        "#fff",

      fontSize: 10,

      fontWeight:
        "900",

      textAlign:
        "center",
    },

    /*
     * =======================================================
     * DATE
     * =======================================================
     */

    date: {
      fontSize: 10,
      color: theme.muted,
      marginLeft: 6,
    },
  });