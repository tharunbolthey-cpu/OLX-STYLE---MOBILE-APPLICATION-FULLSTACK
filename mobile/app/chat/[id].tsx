import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import Screen from "@/components/Screen";

import {
  api,
  token,
  SOCKET_URL,
} from "@/services/api";

import { Message } from "@/types";

import { theme } from "@/constants/theme";

import { useAuth } from "@/context/AuthContext";

import {
  io,
  Socket,
} from "socket.io-client";

export default function Chat() {
  const {
    id,
  } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    user,
  } = useAuth();

  const router = useRouter();

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    text,
    setText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    socket,
    setSocket,
  ] = useState<Socket | null>(null);

  const scrollViewRef =
    useRef<ScrollView | null>(null);

  /* =========================================================
     LOAD MESSAGES
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadMessages =
      async () => {
        try {
          setLoading(true);

          const response =
            await api(
              `/conversations/${id}/messages`
            );

          if (!mounted) {
            return;
          }

          const messageList =
            response?.data?.messages || [];

          setMessages(
            Array.isArray(messageList)
              ? messageList
              : []
          );
        } catch (error) {
          console.log(
            "Failed to load messages:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    if (id) {
      loadMessages();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  /* =========================================================
     SOCKET.IO
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    let currentSocket:
      Socket | null = null;

    const connectSocket =
      async () => {
        try {
          const authToken =
            await token();

          if (
            !authToken ||
            !id ||
            !mounted
          ) {
            return;
          }

          currentSocket =
            io(
              SOCKET_URL,
              {
                auth: {
                  token: authToken,
                },
              }
            );

          currentSocket.on(
            "connect",
            () => {
              currentSocket?.emit(
                "conversation:join",
                id
              );
            }
          );

          currentSocket.on(
            "message:new",
            (message: Message) => {
              if (!mounted) {
                return;
              }

              /*
               * Only add messages belonging
               * to the currently opened
               * conversation.
               */
              const messageConversationId =
                String(
                  (message as any)
                    ?.conversation?._id ||
                  (message as any)
                    ?.conversationId ||
                  ""
                );

              if (
                messageConversationId &&
                messageConversationId !==
                  String(id)
              ) {
                return;
              }

              setMessages(
                current => {
                  const exists =
                    current.some(
                      item =>
                        String(
                          item._id
                        ) ===
                        String(
                          message._id
                        )
                    );

                  if (exists) {
                    return current;
                  }

                  return [
                    ...current,
                    message,
                  ];
                }
              );
            }
          );

          currentSocket.on(
            "connect_error",
            error => {
              console.log(
                "Chat socket error:",
                error.message
              );
            }
          );

          if (mounted) {
            setSocket(
              currentSocket
            );
          }
        } catch (error) {
          console.log(
            "Failed to connect chat socket:",
            error
          );
        }
      };

    connectSocket();

    return () => {
      mounted = false;

      if (currentSocket) {
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
        currentSocket = null;
      }

      setSocket(null);
    };
  }, [id]);

  /* =========================================================
     SCROLL TO BOTTOM
  ========================================================= */

  const scrollToBottom =
    () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd(
          {
            animated: true,
          }
        );
      }, 100);
    };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const send =
    async () => {
      const messageText =
        text.trim();

      if (
        !messageText ||
        !id ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        /*
         * Socket.IO is preferred.
         */
        if (
          socket &&
          socket.connected
        ) {
          socket.emit(
            "message:send",
            {
              conversationId: id,
              text: messageText,
            }
          );

          setText("");

          scrollToBottom();

          return;
        }

        /*
         * HTTP fallback.
         */
        const response =
          await api(
            `/conversations/${id}/messages`,
            {
              method: "POST",

              body: JSON.stringify({
                text: messageText,
              }),
            }
          );

        const newMessage =
          response?.data?.message;

        if (newMessage) {
          setMessages(
            current => {
              const exists =
                current.some(
                  item =>
                    String(
                      item._id
                    ) ===
                    String(
                      newMessage._id
                    )
                );

              if (exists) {
                return current;
              }

              return [
                ...current,
                newMessage,
              ];
            }
          );
        }

        setText("");

        scrollToBottom();
      } catch (error) {
        console.log(
          "Failed to send message:",
          error
        );
      } finally {
        setSending(false);
      }
    };

  /* =========================================================
     CHECK MY MESSAGE
  ========================================================= */

  const isMine =
    (message: Message) => {
      return (
        String(
          message.sender?._id ||
          message.sender
        ) ===
        String(
          user?.id ||
          user?._id
        )
      );
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? 0
          : 0
      }
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <View
        style={s.header}
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={s.backButton}
        >
          <Text
            style={s.backText}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={s.headerCenter}
        >
          <Text
            style={s.headerTitle}
            numberOfLines={1}
          >
            Chat
          </Text>

          <Text
            style={s.headerSubtitle}
          >
            Messages
          </Text>
        </View>

        <View
          style={s.headerSpacer}
        />
      </View>

      {/* ===================================================
          MESSAGES
      =================================================== */}

      <View
        style={s.messagesContainer}
      >
        {loading ? (
          <View
            style={s.loadingContainer}
          >
            <ActivityIndicator
              size="small"
              color={
                theme.primary
              }
            />

            <Text
              style={
                s.loadingText
              }
            >
              Loading messages...
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={s.scroll}
            contentContainerStyle={
              s.messagesContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            onContentSizeChange={
              scrollToBottom
            }
          >
            {!messages.length && (
              <View
                style={
                  s.emptyContainer
                }
              >
                <View
                  style={
                    s.emptyIcon
                  }
                >
                  <Text
                    style={
                      s.emptyIconText
                    }
                  >
                    💬
                  </Text>
                </View>

                <Text
                  style={
                    s.emptyTitle
                  }
                >
                  Start the conversation
                </Text>

                <Text
                  style={
                    s.emptyText
                  }
                >
                  Send a message to start chatting.
                </Text>
              </View>
            )}

            {messages.map(
              message => {
                const mine =
                  isMine(
                    message
                  );

                return (
                  <View
                    key={
                      message._id
                    }
                    style={[
                      s.messageRow,
                      mine &&
                        s.messageRowMine,
                    ]}
                  >
                    <View
                      style={[
                        s.bubble,
                        mine &&
                          s.mine,
                      ]}
                    >
                      <Text
                        style={[
                          s.messageText,
                          mine &&
                            s.mineMessageText,
                        ]}
                      >
                        {
                          message.text
                        }
                      </Text>

                      <Text
                        style={[
                          s.time,
                          mine &&
                            s.mineTime,
                        ]}
                      >
                        {new Date(
                          message.createdAt
                        ).toLocaleTimeString(
                          [],
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                  </View>
                );
              }
            )}

            <View
              style={
                s.bottomSpace
              }
            />
          </ScrollView>
        )}
      </View>

      {/* ===================================================
          MESSAGE COMPOSER
      =================================================== */}

      <View
        style={s.composer}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message..."
          placeholderTextColor={
            "#98A2B3"
          }
          style={s.input}
          multiline
          maxLength={1000}
          editable={!sending}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (
              Platform.OS !==
              "ios"
            ) {
              send();
            }
          }}
        />

        <Pressable
          onPress={send}
          disabled={
            sending ||
            !text.trim()
          }
          style={[
            s.send,
            (!text.trim() ||
              sending) &&
              s.sendDisabled,
          ]}
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Text
              style={
                s.sendText
              }
            >
              Send
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ===========================================================
   STYLES
=========================================================== */

const s =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        theme.bg,
    },

    /* =======================================================
       HEADER
    ======================================================= */

    header: {
      height: 64,
      backgroundColor:
        "#fff",
      borderBottomWidth: 1,
      borderBottomColor:
        theme.line,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 14,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#F2F4F7",
    },

    backText: {
      fontSize: 34,
      lineHeight: 36,
      color:
        theme.ink,
      marginTop: -4,
    },

    headerCenter: {
      flex: 1,
      alignItems:
        "center",
      paddingHorizontal: 10,
    },

    headerTitle: {
      fontSize: 17,
      fontWeight:
        "900",
      color:
        theme.ink,
    },

    headerSubtitle: {
      fontSize: 11,
      color:
        theme.muted,
      marginTop: 2,
    },

    headerSpacer: {
      width: 42,
    },

    /* =======================================================
       MESSAGES
    ======================================================= */

    messagesContainer: {
      flex: 1,
    },

    scroll: {
      flex: 1,
    },

    messagesContent: {
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 20,
    },

    messageRow: {
      width: "100%",
      flexDirection:
        "row",
      justifyContent:
        "flex-start",
      marginBottom: 9,
    },

    messageRowMine: {
      justifyContent:
        "flex-end",
    },

    bubble: {
      alignSelf:
        "flex-start",
      maxWidth: "82%",
      backgroundColor:
        "#fff",
      borderRadius: 18,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor:
        theme.line,
    },

    mine: {
      alignSelf:
        "flex-end",
      backgroundColor:
        theme.primary,
      borderColor:
        theme.primary,
    },

    messageText: {
      color:
        theme.ink,
      fontSize: 14,
      lineHeight: 20,
    },

    mineMessageText: {
      color:
        "#fff",
    },

    time: {
      fontSize: 9,
      color:
        theme.muted,
      marginTop: 5,
      alignSelf:
        "flex-end",
    },

    mineTime: {
      color:
        "#D6E4FF",
    },

    bottomSpace: {
      height: 10,
    },

    /* =======================================================
       LOADING
    ======================================================= */

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color:
        theme.muted,
      fontSize: 12,
      marginTop: 8,
    },

    /* =======================================================
       EMPTY STATE
    ======================================================= */

    emptyContainer: {
      flex: 1,
      minHeight: 450,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor:
        "#EEF4FF",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 14,
    },

    emptyIconText: {
      fontSize: 30,
    },

    emptyTitle: {
      fontSize: 17,
      fontWeight:
        "900",
      color:
        theme.ink,
      textAlign:
        "center",
    },

    emptyText: {
      fontSize: 12,
      color:
        theme.muted,
      marginTop: 6,
      textAlign:
        "center",
    },

    /* =======================================================
       COMPOSER
    ======================================================= */

    composer: {
      backgroundColor:
        "#fff",
      borderTopWidth: 1,
      borderTopColor:
        theme.line,
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom:
        Platform.OS ===
        "ios"
          ? 24
          : 10,
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      gap: 8,
    },

    input: {
      flex: 1,
      minHeight: 46,
      maxHeight: 110,
      borderWidth: 1,
      borderColor:
        theme.line,
      borderRadius: 15,
      paddingHorizontal: 13,
      paddingTop: 12,
      paddingBottom: 10,
      color:
        theme.ink,
      backgroundColor:
        "#fff",
      fontSize: 14,
    },

    send: {
      height: 46,
      minWidth: 70,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor:
        theme.primary,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sendDisabled: {
      opacity: 0.5,
    },

    sendText: {
      color:
        "#fff",
      fontWeight:
        "900",
      fontSize: 13,
    },
  });