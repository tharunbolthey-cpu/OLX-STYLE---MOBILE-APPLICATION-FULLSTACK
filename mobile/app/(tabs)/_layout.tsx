import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Tabs,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  io,
  Socket,
} from 'socket.io-client';

import {
  theme,
} from '@/constants/theme';

import {
  api,
  SOCKET_URL,
  token,
} from '@/services/api';

type NotificationItem = {
  _id: string;
  read: boolean;
  type?: string;
  conversationId?: string;
  data?: {
    conversationId?: string;
  };
};

export default function TabsLayout() {
  const [
    unreadMessages,
    setUnreadMessages,
  ] = useState(0);

  const loadUnreadMessages =
    useCallback(async () => {
      try {
        const response =
          await api('/notifications');

        const notifications: NotificationItem[] =
          response?.data?.notifications || [];

        const count =
          notifications.filter(
            notification => {
              const type =
                String(
                  notification.type || ''
                ).toLowerCase();

              const isMessage =
                type === 'message' ||
                type === 'chat' ||
                type === 'new_message';

              return (
                isMessage &&
                !notification.read
              );
            }
          ).length;

        setUnreadMessages(count);
      } catch (error) {
        console.log(
          'Failed to load unread message count:',
          error
        );
      }
    }, []);

  useEffect(() => {
    loadUnreadMessages();
  }, [
    loadUnreadMessages,
  ]);

  useEffect(() => {
    let socket: Socket | null = null;

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

              const type =
                String(
                  notification.type || ''
                ).toLowerCase();

              const isMessage =
                type === 'message' ||
                type === 'chat' ||
                type === 'new_message';

              if (!isMessage) {
                return;
              }

              loadUnreadMessages();
            }
          );

          socket.on(
            'message:new',
            () => {
              if (!mounted) {
                return;
              }

              loadUnreadMessages();
            }
          );

          socket.on(
            'connect_error',
            error => {
              console.log(
                'Chats badge socket error:',
                error.message
              );
            }
          );
        } catch (error) {
          console.log(
            'Failed to connect chats badge socket:',
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
    loadUnreadMessages,
  ]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          theme.primary,

        tabBarInactiveTintColor:
          '#98A2B3',

        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 9,
          borderTopColor:
            theme.line,
          backgroundColor: '#fff',
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="grid-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({
            color,
          }) => (
            <Ionicons
              name="add-circle"
              size={38}
              color={theme.primary}
            />
          ),
          tabBarLabelStyle: {
            fontWeight: '900',
            color: theme.primary,
          },
        }}
      />

      <Tabs.Screen
        name="chats"
        listeners={{
          tabPress: () => {
            setUnreadMessages(0);
          },
        }}
        options={{
          title: 'Chats',

          tabBarBadge:
            unreadMessages > 0
              ? unreadMessages > 99
                ? '99+'
                : unreadMessages
              : undefined,

          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#fff',
            fontSize: 10,
            fontWeight: '900',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            borderRadius: 9,
          },

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="chatbubbles-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}