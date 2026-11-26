import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

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

import { theme } from '@/constants/theme';


/* =========================================================
   NOTIFICATION TYPES
========================================================= */

type NotificationType =
  | 'message'
  | 'listing_approved'
  | 'listing_rejected'
  | 'favorite'
  | 'report'
  | 'listing_sold'
  | 'listing_deleted';


/* =========================================================
   NOTIFICATION DATA
========================================================= */

type NotificationData = {
  reportId?: string;
  listingId?: string;
  conversationId?: string;
  status?: string;
};


/* =========================================================
   NOTIFICATION ITEM
========================================================= */

type NotificationItem = {
  _id: string;

  user: string;

  type: NotificationType;

  title: string;

  message: string;

  read: boolean;

  createdAt: string;

  updatedAt?: string;

  data?: NotificationData;
};


/* =========================================================
   SWIPEABLE NOTIFICATION PROPS
========================================================= */

type SwipeableNotificationProps = {
  notification: NotificationItem;

  onPress: (
    notification: NotificationItem
  ) => void;

  onDelete: (
    notification: NotificationItem
  ) => void;

  getIcon: (
    type: NotificationType
  ) => any;

  getIconColor: (
    type: NotificationType
  ) => string;

  getIconBackground: (
    type: NotificationType
  ) => string;
};


/* =========================================================
   SWIPEABLE NOTIFICATION
========================================================= */

function SwipeableNotification({
  notification,
  onPress,
  onDelete,
  getIcon,
  getIconColor,
  getIconBackground,
}: SwipeableNotificationProps) {

  const translateX =
    useRef(
      new Animated.Value(0)
    ).current;

  const [deleting, setDeleting] =
    useState(false);


  /* =======================================================
     PAN RESPONDER
  ======================================================= */

  const panResponder =
    useRef(
      PanResponder.create({

        onMoveShouldSetPanResponder: (
          _,
          gestureState
        ) => {

          return (
            Math.abs(
              gestureState.dx
            ) > 8 &&
            Math.abs(
              gestureState.dx
            ) >
              Math.abs(
                gestureState.dy
              )
          );

        },


        onPanResponderMove: (
          _,
          gestureState
        ) => {

          if (
            deleting
          ) {
            return;
          }

          if (
            gestureState.dx < 0
          ) {

            translateX.setValue(
              gestureState.dx
            );

          } else {

            translateX.setValue(
              gestureState.dx * 0.2
            );

          }

        },


        onPanResponderRelease: (
          _,
          gestureState
        ) => {

          if (
            deleting
          ) {
            return;
          }

          const deleteThreshold =
            -120;


          /* ===============================================
             DELETE
          =============================================== */

          if (
            gestureState.dx <
            deleteThreshold
          ) {

            setDeleting(
              true
            );

            Animated.timing(
              translateX,
              {
                toValue:
                  -500,

                duration:
                  220,

                useNativeDriver:
                  true,
              }
            ).start(
              ({
                finished,
              }) => {

                if (
                  finished
                ) {

                  onDelete(
                    notification
                  );

                }

              }
            );

            return;
          }


          /* ===============================================
             RESTORE POSITION
          =============================================== */

          Animated.spring(
            translateX,
            {
              toValue: 0,

              useNativeDriver:
                true,

              tension: 80,

              friction: 10,
            }
          ).start();

        },

      })
    ).current;


  const icon =
    getIcon(
      notification.type
    );

  const iconColor =
    getIconColor(
      notification.type
    );

  const iconBackground =
    getIconBackground(
      notification.type
    );


  return (

    <View
      style={
        styles.swipeContainer
      }
    >

      {/* =================================================
          DELETE BACKGROUND
      ================================================= */}

      <View
        style={
          styles.deleteBackground
        }
      >

        <Ionicons
          name="trash-outline"
          size={23}
          color="#fff"
        />

        <Text
          style={
            styles.deleteText
          }
        >
          Delete
        </Text>

      </View>


      {/* =================================================
          CARD
      ================================================= */}

      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [
              {
                translateX,
              },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >

        <Pressable
          disabled={
            deleting
          }
          onPress={() =>
            onPress(
              notification
            )
          }
          style={[
            styles.card,

            !notification.read &&
              styles.unread,
          ]}
        >

          <View
            style={
              styles.row
            }
          >

            {/* ===========================================
                ICON
            =========================================== */}

            <View
              style={[
                styles.icon,
                {
                  backgroundColor:
                    iconBackground,
                },
              ]}
            >

              <Ionicons
                name={
                  icon
                }
                size={22}
                color={
                  iconColor
                }
              />

            </View>


            {/* ===========================================
                CONTENT
            =========================================== */}

            <View
              style={
                styles.content
              }
            >

              {/* =========================================
                  TITLE
              ========================================= */}

              <View
                style={
                  styles.titleRow
                }
              >

                <Text
                  style={
                    styles.title
                  }
                  numberOfLines={
                    2
                  }
                >
                  {
                    notification.title
                  }
                </Text>


                {!notification.read && (

                  <View
                    style={
                      styles.unreadDot
                    }
                  />

                )}

              </View>


              {/* =========================================
                  MESSAGE
              ========================================= */}

              <Text
                style={
                  styles.message
                }
              >
                {
                  notification.message
                }
              </Text>


              {/* =========================================
                  DATE
              ========================================= */}

              <Text
                style={
                  styles.date
                }
              >
                {new Date(
                  notification.createdAt
                ).toLocaleString()}
              </Text>


              {/* =========================================
                  MESSAGE ACTION
              ========================================= */}

              {notification.type ===
                'message' &&
                notification.data
                  ?.conversationId && (

                  <Text
                    style={
                      styles.actionText
                    }
                  >
                    Open conversation →
                  </Text>

                )}


              {/* =========================================
                  LISTING ACTION
              ========================================= */}

              {notification.data
                ?.listingId &&
                notification.type !==
                  'message' && (

                  <Text
                    style={
                      styles.actionText
                    }
                  >
                    View listing →
                  </Text>

                )}

            </View>

          </View>

        </Pressable>

      </Animated.View>

    </View>

  );

}


/* =========================================================
   MAIN NOTIFICATIONS SCREEN
========================================================= */

export default function Notifications() {

  const router =
    useRouter();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    items,
    setItems
  ] =
    useState<
      NotificationItem[]
    >([]);


  const [
    loading,
    setLoading
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing
  ] =
    useState(false);


  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  const load =
    useCallback(
      async () => {

        try {

          const response =
            await api(
              '/notifications'
            );


          const notifications =
            response
              ?.data
              ?.notifications ||
            [];


          setItems(
            notifications
          );

        } catch (
          error
        ) {

          console.error(
            'Failed to load notifications:',
            error
          );

        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );

        }

      },
      []
    );


  /* =======================================================
     REFRESH WHEN SCREEN GETS FOCUS
  ======================================================= */

  useFocusEffect(
    useCallback(
      () => {

        load();

      },
      [load]
    )
  );


  /* =======================================================
     REAL-TIME SOCKET.IO
  ======================================================= */

  useEffect(
    () => {

      let socket:
        Socket | null =
        null;

      let mounted =
        true;


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


            socket =
              io(
                SOCKET_URL,
                {
                  auth: {
                    token:
                      authToken,
                  },
                }
              );


            /* ============================================
               CONNECTED
            ============================================ */

            socket.on(
              'connect',
              () => {

                console.log(
                  'Notification socket connected:',
                  socket?.id
                );

              }
            );


            /* ============================================
               NEW NOTIFICATION
            ============================================ */

            socket.on(
              'notification:new',
              (
                notification:
                  NotificationItem
              ) => {

                if (
                  !mounted
                ) {

                  return;

                }


                if (
                  !notification ||
                  !notification._id
                ) {

                  return;

                }


                setItems(
                  current => {

                    const exists =
                      current.some(
                        item =>
                          item._id ===
                          notification._id
                      );


                    if (
                      exists
                    ) {

                      return current;

                    }


                    return [
                      notification,
                      ...current,
                    ].slice(
                      0,
                      100
                    );

                  }
                );

              }
            );


            /* ============================================
               SOCKET ERROR
            ============================================ */

            socket.on(
              'connect_error',
              error => {

                console.error(
                  'Notification socket error:',
                  error.message
                );

              }
            );


            /* ============================================
               DISCONNECTED
            ============================================ */

            socket.on(
              'disconnect',
              reason => {

                console.log(
                  'Notification socket disconnected:',
                  reason
                );

              }
            );

          } catch (
            error
          ) {

            console.error(
              'Failed to connect notification socket:',
              error
            );

          }

        };


      connectSocket();


      /* ================================================
         CLEANUP
      ================================================ */

      return () => {

        mounted =
          false;


        if (
          socket
        ) {

          socket.removeAllListeners();

          socket.disconnect();

          socket =
            null;

        }

      };

    },
    []
  );


  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const refresh =
    async () => {

      setRefreshing(
        true
      );

      await load();

    };


  /* =======================================================
     MARK SINGLE NOTIFICATION AS READ
  ======================================================= */

  const markAsRead =
    async (
      notification:
        NotificationItem
    ) => {

      if (
        notification.read
      ) {

        return;

      }


      try {

        await api(
          `/notifications/${notification._id}/read`,
          {
            method:
              'PUT',
          }
        );


        setItems(
          current =>
            current.map(
              item =>
                item._id ===
                notification._id
                  ? {
                      ...item,
                      read: true,
                    }
                  : item
            )
        );

      } catch (
        error
      ) {

        console.error(
          'Failed to mark notification as read:',
          error
        );

      }

    };


  /* =======================================================
     MARK ALL AS READ
  ======================================================= */

  const markAllAsRead =
    async () => {

      try {

        await api(
          '/notifications/read-all',
          {
            method:
              'PUT',
          }
        );


        setItems(
          current =>
            current.map(
              item => ({
                ...item,
                read: true,
              })
            )
        );

      } catch (
        error
      ) {

        console.error(
          'Failed to mark all notifications as read:',
          error
        );

      }

    };


  /* =======================================================
     DELETE NOTIFICATION
  ======================================================= */

  const deleteNotification =
    async (
      notification:
        NotificationItem
    ) => {

      /*
       * Remove immediately from UI.
       * This makes the swipe feel instant.
       */

      setItems(
        current =>
          current.filter(
            item =>
              item._id !==
              notification._id
          )
      );


      try {

        await api(
          `/notifications/${notification._id}`,
          {
            method:
              'DELETE',
          }
        );

      } catch (
        error
      ) {

        console.error(
          'Failed to delete notification:',
          error
        );


        /*
         * Restore notification
         * if backend deletion failed.
         */

        setItems(
          current => {

            const exists =
              current.some(
                item =>
                  item._id ===
                  notification._id
              );


            if (
              exists
            ) {

              return current;

            }


            return [
              notification,
              ...current,
            ].sort(
              (
                a,
                b
              ) =>
                new Date(
                  b.createdAt
                ).getTime() -
                new Date(
                  a.createdAt
                ).getTime()
            );

          }
        );

      }

    };


  /* =======================================================
     HANDLE NOTIFICATION PRESS
  ======================================================= */

  const handlePress =
    async (
      notification:
        NotificationItem
    ) => {

      await markAsRead(
        notification
      );


      /* ================================================
         MESSAGE
      ================================================ */

      if (
        notification.type ===
          'message' &&
        notification.data
          ?.conversationId
      ) {

        router.push(
          `/chat/${notification.data.conversationId}` as any
        );

        return;

      }


      /* ================================================
         LISTING
      ================================================ */

      if (
        notification.data
          ?.listingId
      ) {

        router.push(
          `/listing/${notification.data.listingId}` as any
        );

        return;

      }

    };


  /* =======================================================
     GET ICON
  ======================================================= */

  const getIcon =
    (
      type:
        NotificationType
    ): any => {

      switch (
        type
      ) {

        case 'message':

          return (
            'chatbubble-ellipses-outline'
          );


        case 'listing_approved':

          return (
            'checkmark-circle-outline'
          );


        case 'listing_rejected':

          return (
            'close-circle-outline'
          );


        case 'favorite':

          return (
            'heart-outline'
          );


        case 'report':

          return (
            'flag-outline'
          );


        case 'listing_sold':

          return (
            'pricetag-outline'
          );


        case 'listing_deleted':

          return (
            'trash-outline'
          );


        default:

          return (
            'notifications-outline'
          );

      }

    };


  /* =======================================================
     GET ICON COLOR
  ======================================================= */

  const getIconColor =
    (
      type:
        NotificationType
    ) => {

      switch (
        type
      ) {

        case 'listing_approved':

          return '#027A48';


        case 'listing_rejected':

          return '#B42318';


        case 'favorite':

          return '#E11D48';


        case 'report':

          return '#B54708';


        case 'listing_sold':

          return '#027A48';


        case 'listing_deleted':

          return '#B42318';


        case 'message':

          return '#2563EB';


        default:

          return theme.primary;

      }

    };


  /* =======================================================
     GET ICON BACKGROUND
  ======================================================= */

  const getIconBackground =
    (
      type:
        NotificationType
    ) => {

      switch (
        type
      ) {

        case 'listing_approved':

          return '#ECFDF3';


        case 'listing_rejected':

          return '#FEF3F2';


        case 'favorite':

          return '#FFF1F2';


        case 'report':

          return '#FFF4E5';


        case 'listing_sold':

          return '#ECFDF3';


        case 'listing_deleted':

          return '#FEF3F2';


        case 'message':

          return '#EEF4FF';


        default:

          return '#EEF4FF';

      }

    };


  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  const unreadCount =
    items.filter(
      item =>
        !item.read
    ).length;


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <Screen>

      <View
        style={
          styles.container
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={
            styles.header
          }
        >

          <View
            style={
              styles.headerText
            }
          >

            <Text
              style={
                styles.heading
              }
            >
              Notifications
            </Text>


            <Text
              style={
                styles.subtitle
              }
            >
              Stay updated about your Marketly activity.
            </Text>

          </View>


          <Pressable
            onPress={
              refresh
            }
            style={
              styles.refreshButton
            }
          >

            <Ionicons
              name="refresh-outline"
              size={21}
              color={
                theme.ink
              }
            />

          </Pressable>

        </View>


        {/* =================================================
            ACTION ROW
        ================================================= */}

        {!loading &&
          items.length >
            0 && (

            <View
              style={
                styles.actionRow
              }
            >

              <Text
                style={
                  styles.countText
                }
              >
                {unreadCount} unread
              </Text>


              {unreadCount >
                0 && (

                <Pressable
                  onPress={
                    markAllAsRead
                  }
                >

                  <Text
                    style={
                      styles.markAll
                    }
                  >
                    Mark all as read
                  </Text>

                </Pressable>

              )}

            </View>

          )}


        {/* =================================================
            SWIPE HINT
        ================================================= */}

        {!loading &&
          items.length >
            0 && (

            <View
              style={
                styles.swipeHint
              }
            >

              <Ionicons
                name="arrow-back-outline"
                size={15}
                color={
                  theme.muted
                }
              />

              <Text
                style={
                  styles.swipeHintText
                }
              >
                Swipe left to delete
              </Text>

            </View>

          )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <View
            style={
              styles.loading
            }
          >

            <ActivityIndicator
              size="large"
              color={
                theme.primary
              }
            />


            <Text
              style={
                styles.loadingText
              }
            >
              Loading notifications...
            </Text>

          </View>

        ) : (

          <View>

            {/* =============================================
                NOTIFICATION LIST
            ============================================= */}

            {items.map(
              notification => (

                <SwipeableNotification
                  key={
                    notification._id
                  }

                  notification={
                    notification
                  }

                  onPress={
                    handlePress
                  }

                  onDelete={
                    deleteNotification
                  }

                  getIcon={
                    getIcon
                  }

                  getIconColor={
                    getIconColor
                  }

                  getIconBackground={
                    getIconBackground
                  }

                />

              )
            )}


            {/* =============================================
                EMPTY STATE
            ============================================= */}

            {!items.length && (

              <View
                style={
                  styles.empty
                }
              >

                <View
                  style={
                    styles.emptyIcon
                  }
                >

                  <Ionicons
                    name="notifications-off-outline"
                    size={35}
                    color={
                      theme.muted
                    }
                  />

                </View>


                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  You're all caught up
                </Text>


                <Text
                  style={
                    styles.emptyText
                  }
                >
                  You don't have any notifications yet.
                </Text>

              </View>

            )}

          </View>

        )}


        {/* =================================================
            REFRESH INDICATOR
        ================================================= */}

        {refreshing && (

          <View
            style={
              styles.refreshing
            }
          >

            <ActivityIndicator
              size="small"
              color={
                theme.primary
              }
            />

          </View>

        )}

      </View>

    </Screen>

  );

}


/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    container: {
      paddingBottom: 30,
    },


    header: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      marginBottom:
        12,
    },


    headerText: {
      flex: 1,

      paddingRight:
        12,
    },


    heading: {
      fontSize: 30,

      fontWeight: '900',

      color:
        theme.ink,
    },


    subtitle: {
      color:
        theme.muted,

      fontSize: 12,

      marginTop: 4,

      lineHeight: 18,
    },


    refreshButton: {
      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:
        '#fff',

      borderWidth: 1,

      borderColor:
        theme.line,

      alignItems:
        'center',

      justifyContent:
        'center',
    },


    actionRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        4,
    },


    countText: {
      color:
        theme.muted,

      fontSize: 12,

      fontWeight:
        '600',
    },


    markAll: {
      color:
        theme.primary,

      fontSize: 12,

      fontWeight:
        '800',
    },


    swipeHint: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        10,

      paddingLeft:
        2,
    },


    swipeHintText: {
      color:
        theme.muted,

      fontSize: 10,

      marginLeft: 4,
    },


    loading: {
      alignItems:
        'center',

      justifyContent:
        'center',

      paddingTop:
        60,
    },


    loadingText: {
      color:
        theme.muted,

      marginTop: 10,

      fontSize: 12,
    },


    /* =====================================================
       SWIPE CONTAINER
    ===================================================== */

    swipeContainer: {
      position:
        'relative',

      marginBottom:
        10,

      borderRadius:
        18,

      overflow:
        'hidden',
    },


    /* =====================================================
       DELETE BACKGROUND
    ===================================================== */

    deleteBackground: {
      position:
        'absolute',

      top: 0,

      right: 0,

      bottom: 0,

      width: 120,

      backgroundColor:
        '#DC2626',

      alignItems:
        'center',

      justifyContent:
        'center',

      flexDirection:
        'row',

      gap: 6,

      borderRadius:
        18,
    },


    deleteText: {
      color:
        '#fff',

      fontSize: 12,

      fontWeight:
        '900',
    },


    /* =====================================================
       CARD WRAPPER
    ===================================================== */

    cardWrapper: {
      width:
        '100%',
    },


    /* =====================================================
       CARD
    ===================================================== */

    card: {
      backgroundColor:
        '#fff',

      padding: 15,

      borderRadius:
        18,

      borderWidth: 1,

      borderColor:
        theme.line,
    },


    unread: {
      borderColor:
        '#B8CCFF',

      backgroundColor:
        '#F8FAFF',
    },


    row: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },


    icon: {
      width: 46,

      height: 46,

      borderRadius: 23,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        12,
    },


    content: {
      flex: 1,
    },


    titleRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },


    title: {
      flex: 1,

      fontWeight:
        '900',

      color:
        theme.ink,

      fontSize: 14,

      lineHeight: 19,
    },


    unreadDot: {
      width: 8,

      height: 8,

      borderRadius: 4,

      backgroundColor:
        theme.primary,

      marginLeft: 8,

      marginTop: 5,
    },


    message: {
      fontSize: 13,

      color:
        theme.muted,

      marginTop: 5,

      lineHeight: 19,
    },


    date: {
      fontSize: 10,

      color:
        theme.muted,

      marginTop: 9,
    },


    actionText: {
      color:
        theme.primary,

      fontWeight:
        '800',

      fontSize: 11,

      marginTop: 8,
    },


    empty: {
      alignItems:
        'center',

      paddingTop:
        60,

      paddingHorizontal:
        30,
    },


    emptyIcon: {
      width: 70,

      height: 70,

      borderRadius: 35,

      backgroundColor:
        theme.bg,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        15,
    },


    emptyTitle: {
      fontSize: 18,

      fontWeight:
        '900',

      color:
        theme.ink,
    },


    emptyText: {
      color:
        theme.muted,

      fontSize: 13,

      marginTop: 6,

      textAlign:
        'center',
    },


    refreshing: {
      position:
        'absolute',

      top: 8,

      right: 55,
    },

  });