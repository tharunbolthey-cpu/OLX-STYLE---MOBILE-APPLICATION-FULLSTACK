import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import Screen from "@/components/Screen";
import { api, getImageUrl } from "@/services/api";
import { Listing } from "@/types";
import { theme } from "@/constants/theme";
import { useFavorites } from "@/context/FavoritesContext";

export default function Details() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  const { width } = useWindowDimensions();

  const [item, setItem] =
    useState<Listing | null>(null);

  const [slide, setSlide] = useState(0);

  const { ids, toggle } = useFavorites();

  const galleryRef =
    useRef<FlatList<string>>(null);

  useEffect(() => {
    api(`/listings/${id}`)
      .then((b) => {
        setItem(b.data.listing);
      })
      .catch((error) => {
        console.error(
          "Could not load listing:",
          error
        );
      });
  }, [id]);

  if (!item) {
    return (
      <Screen>
        <Text>Loading listing…</Text>
      </Screen>
    );
  }

  /*
   * Make sure we always have an array.
   */
  const images =
    item.images && item.images.length > 0
      ? item.images
      : [];

  /*
   * If there are no images, show one empty
   * gallery item.
   */
  const galleryImages =
    images.length > 0 ? images : [""];

  /*
   * Start chat with seller.
   */
  const chat = async () => {
    try {
      const b = await api(
        "/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            listing: item._id,
          }),
        }
      );

      router.push(
        `/chat/${b.data.conversation._id}` as any
      );
    } catch (e: any) {
      Alert.alert(
        "Unable to start chat",
        e?.message ||
          "Something went wrong."
      );
    }
  };

  /*
   * Open report screen.
   */
  const openReport = () => {
    router.push({
      pathname: "/report",
      params: {
        listing: item._id,
      },
    });
  };

  /*
   * Change image using the dots.
   */
  const goToSlide = (index: number) => {
    setSlide(index);

    galleryRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  /*
   * Update the active image after
   * the user finishes swiping.
   */
  const handleGalleryScroll = (
    event: any
  ) => {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const pageWidth =
      event.nativeEvent.layoutMeasurement.width;

    if (!pageWidth) {
      return;
    }

    const index = Math.round(
      offsetX / pageWidth
    );

    if (index !== slide) {
      setSlide(index);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
      }}
    >
      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {/* =================================================
                IMAGE GALLERY
            ================================================= */}

            <View style={s.gallery}>
              <FlatList
                ref={galleryRef}
                data={galleryImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                nestedScrollEnabled
                keyExtractor={(image, index) =>
                  `${image}-${index}`
                }
                onMomentumScrollEnd={
                  handleGalleryScroll
                }
                getItemLayout={(
                  _data,
                  index
                ) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                renderItem={({
                  item: imageUri,
                }) => (
                  <View
                    style={[
                      s.imagePage,
                      {
                        width,
                      },
                    ]}
                  >
                    {imageUri ? (
                    <Image
  source={{
    uri: getImageUrl(imageUri),
  }}
  style={s.hero}
/>
                    ) : (
                      <View
                        style={s.noImage}
                      >
                        <Ionicons
                          name="image-outline"
                          size={50}
                          color={theme.muted}
                        />

                        <Text
                          style={
                            s.noImageText
                          }
                        >
                          No image available
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              />

              {/* =============================================
                  BACK BUTTON
              ============================================= */}

              <Pressable
                onPress={() =>
                  router.back()
                }
                style={s.back}
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color={theme.ink}
                />
              </Pressable>

              {/* =============================================
                  FAVORITE BUTTON
              ============================================= */}

              <Pressable
                onPress={() =>
                  toggle(item._id)
                }
                style={s.fav}
              >
                <Ionicons
                  name={
                    ids.has(item._id)
                      ? "heart"
                      : "heart-outline"
                  }
                  size={22}
                  color={
                    ids.has(item._id)
                      ? theme.danger
                      : theme.ink
                  }
                />
              </Pressable>

              {/* =============================================
                  IMAGE COUNTER
              ============================================= */}

              <Text style={s.counter}>
                {slide + 1}/
                {Math.max(
                  galleryImages.length,
                  1
                )}
              </Text>

              {/* =============================================
                  DOTS
              ============================================= */}

              {galleryImages.length > 1 && (
                <View style={s.dots}>
                  {galleryImages.map(
                    (_, index) => (
                      <Pressable
                        key={index}
                        onPress={() =>
                          goToSlide(index)
                        }
                        style={[
                          s.dot,
                          index === slide &&
                            s.dotActive,
                        ]}
                      />
                    )
                  )}
                </View>
              )}
            </View>

            {/* =================================================
                LISTING CONTENT
            ================================================= */}

            <View style={s.content}>
              {/* Price */}

              <Text style={s.price}>
                ₹
                {Number(
                  item.price
                ).toLocaleString(
                  "en-IN"
                )}
              </Text>

              {/* Title */}

              <Text style={s.title}>
                {item.title}
              </Text>

              {/* Meta */}

              <Text style={s.meta}>
                {item.location} ·{" "}
                {new Date(
                  item.createdAt
                ).toLocaleDateString()}{" "}
                · {item.views} views
              </Text>

              <View style={s.rule} />

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <Text style={s.heading}>
                Description
              </Text>

              <Text style={s.desc}>
                {item.description}
              </Text>

              {/* =================================================
                  DETAILS
              ================================================= */}

              <Text style={s.heading}>
                Details
              </Text>

              <View style={s.details}>
                <Text style={s.detail}>
                  Category:{" "}
                  {(item.category as any)
                    ?.name || "—"}
                </Text>

                <Text style={s.detail}>
                  Condition:{" "}
                  {item.condition}
                </Text>
              </View>

              {/* =================================================
                  SELLER
              ================================================= */}

              <View style={s.seller}>
                <View style={s.avatar}>
                  <Text
                    style={s.avatarText}
                  >
                    {item.seller.name.slice(
                      0,
                      1
                    )}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "900",
                      fontSize: 16,
                    }}
                  >
                    {item.seller.name}
                  </Text>

                  <Text style={s.meta}>
                    {item.seller
                      .location ||
                      "Local seller"}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    router.push(
                      `/seller/${item.seller._id}` as any
                    )
                  }
                >
                  <Text
                    style={{
                      color:
                        theme.primary,
                      fontWeight: "800",
                    }}
                  >
                    View
                  </Text>
                </Pressable>
              </View>

              {/* =================================================
                  REPORT LISTING
              ================================================= */}

              <Pressable
                onPress={openReport}
                style={s.reportButton}
              >
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color={theme.danger}
                />

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      s.reportTitle
                    }
                  >
                    Report this listing
                  </Text>

                  <Text
                    style={
                      s.reportDescription
                    }
                  >
                    Report scams, fake
                    listings, offensive
                    content or other
                    issues.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.muted}
                />
              </Pressable>

              {/* Extra space above bottom actions */}

              <View
                style={{
                  height: 120,
                }}
              />
            </View>
          </>
        }
        renderItem={null}
        keyExtractor={() => "listing-content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
      />

      {/* =====================================================
          BOTTOM ACTIONS
      ===================================================== */}

      <View style={s.actions}>
        {/* Chat */}

        <Pressable
          onPress={chat}
          style={s.chat}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color={theme.primary}
          />

          <Text
            style={{
              fontWeight: "900",
              color: theme.primary,
            }}
          >
            Chat
          </Text>
        </Pressable>

        {/* Contact */}

        <Pressable
          onPress={() =>
            Alert.alert(
              "Contact seller",
              `For privacy, use Chat to arrange a call with ${item.seller.name}.`
            )
          }
          style={s.contact}
        >
          <Ionicons
            name="call-outline"
            size={20}
            color="#fff"
          />

          <Text
            style={{
              fontWeight: "900",
              color: "#fff",
            }}
          >
            Contact seller
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* =========================================================
     GALLERY
  ========================================================= */

  gallery: {
    height: 360,
    backgroundColor: "#EEF1F5",
    position: "relative",
  },

  imagePage: {
    height: 360,
    backgroundColor: "#EEF1F5",
  },

  hero: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  noImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  noImageText: {
    color: theme.muted,
    marginTop: 8,
    fontSize: 12,
  },

  /* =========================================================
     BACK BUTTON
  ========================================================= */

  back: {
    position: "absolute",
    left: 16,
    top: 48,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  /* =========================================================
     FAVORITE BUTTON
  ========================================================= */

  fav: {
    position: "absolute",
    right: 16,
    top: 48,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  /* =========================================================
     COUNTER
  ========================================================= */

  counter: {
    position: "absolute",
    right: 18,
    bottom: 18,
    backgroundColor: "#0009",
    color: "#fff",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 11,
  },

  /* =========================================================
     DOTS
  ========================================================= */

  dots: {
    position: "absolute",
    bottom: 19,
    left: 18,
    flexDirection: "row",
    gap: 5,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff9",
  },

  dotActive: {
    width: 18,
    backgroundColor: "#fff",
  },

  /* =========================================================
     CONTENT
  ========================================================= */

  content: {
    padding: 20,
  },

  price: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.ink,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 5,
    color: theme.ink,
  },

  meta: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 7,
  },

  rule: {
    height: 1,
    backgroundColor: theme.line,
    marginVertical: 20,
  },

  heading: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
    color: theme.ink,
  },

  desc: {
    color: "#344054",
    lineHeight: 22,
    marginBottom: 20,
  },

  /* =========================================================
     DETAILS
  ========================================================= */

  details: {
    backgroundColor: theme.bg,
    borderRadius: 15,
    padding: 14,
    marginBottom: 20,
  },

  detail: {
    fontSize: 13,
    color: theme.ink,
    marginBottom: 7,
  },

  /* =========================================================
     SELLER
  ========================================================= */

  seller: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontWeight: "900",
    fontSize: 18,
    color: theme.primary,
  },

  /* =========================================================
     REPORT
  ========================================================= */

  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
    borderRadius: 15,
    padding: 14,
    marginTop: 10,
    marginBottom: 20,
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.danger,
  },

  reportDescription: {
    fontSize: 11,
    color: theme.muted,
    marginTop: 4,
    lineHeight: 16,
  },

  /* =========================================================
     BOTTOM ACTIONS
  ========================================================= */

  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: theme.line,
    flexDirection: "row",
    gap: 10,
  },

  chat: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.primary,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  contact: {
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.primary,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
});