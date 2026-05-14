import React from "react";
import { Modal, View, StyleSheet, Pressable, SafeAreaView, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

interface FullScreenImageViewerProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");

export function FullScreenImageViewer({ visible, uri, onClose }: FullScreenImageViewerProps) {
  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            transition={300}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  safeArea: {
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width,
    height: height * 0.8,
  },
});
