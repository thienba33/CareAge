import React from "react";
import { StyleSheet, View } from "react-native";

export default function HeroBlobs() {
  return (
    <>
      <View pointerEvents="none" style={[styles.blob, styles.blobOne]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTwo]} />
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.08,
  },
  blobOne: {
    width: 180,
    height: 180,
    top: -60,
    right: -50,
  },
  blobTwo: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -30,
  },
});
