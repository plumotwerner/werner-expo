import { StyleSheet, Text, View } from "react-native";

export default function FlexboxScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.box, { backgroundColor: "tomato" }]}>
        <Text style={styles.label}>1</Text>
      </View>
      <View style={[styles.box, { backgroundColor: "royalblue" }]}>
        <Text style={styles.label}>2</Text>
      </View>
      <View style={[styles.box, { backgroundColor: "seagreen" }]}>
        <Text style={styles.label}>3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
  },
  box: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});
