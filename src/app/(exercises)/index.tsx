import { Href, useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type Exercise = {
  href: Href;
  title: string;
  description: string;
};

const EXERCISES: Exercise[] = [
  {
    href: "/flexbox",
    title: "Step 20 · Flexbox",
    description: "Layout with View, Text/ Flexbox",
  },
  {
    href: "/state-and-hooks",
    title: "Step 21 · State and hooks",
    description: "useState, TextInput and Pressable",
  },
  {
    href: "/platform",
    title: "Step 22 · Platform",
    description: "Platform.OS and Platform.select for iOS and Android",
  },
  {
    href: "/form",
    title: "Steps 23 and 24 · Form",
    description: "Name, role and date picker, with keyboard handling",
  },
  {
    href: "/navigation",
    title: "Step 25 · Navigation",
    description: "Its own screen stack, back behaviour and deep links",
  },
  {
    href: "/notifications",
    title: "Step 26 · Notifications",
    description: "Schedule a local notification, with permission handling",
  },
  {
    href: "/notes",
    title: "Step 27 · Notes",
    description: "Offline-first storage with expo-sqlite and a FlatList",
  },
  {
    href: "/long-image-list",
    title: "Step 28 · Long image list",
    description:
      "2000 items from the API, 3 pages of 50 in memory, bidirectional infinite scroll",
  },
  {
    href: "/camera",
    title: "Step 29 · Camera",
    description: "Live preview, take a photo and view it full screen",
  },
  {
    href: "/skia",
    title: "Step 30 · Skia graphics",
    description:
      "A draggable glass card with a backdrop blur and an animated line chart",
  },
];

// __DEV__ is true for JavaScript served by Metro (Expo Go and development
// builds). Only a release build can run the bundled code or a real OTA update.
function describeRunningCode(): string {
  if (__DEV__) return "Running from Metro (development)";
  if (Updates.isEmbeddedLaunch) return "Running the bundled version";
  return `Running OTA update: ${Updates.updateId ?? "unknown id"}`;
}

export default function OverviewScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>React Native exercises</Text>
      <Text style={styles.intro}>
        Open the menu at the top left, or pick an exercise below.
      </Text>
      <Text style={styles.intro}>{describeRunningCode()}</Text>

      {EXERCISES.map((exercise) => (
        <Pressable
          key={exercise.title}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(exercise.href)}
        >
          <Text style={styles.cardTitle}>{exercise.title}</Text>
          <Text style={styles.cardDescription}>{exercise.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
    backgroundColor: "white",
    flexGrow: 1,
  },
  heading: { fontSize: 28, fontWeight: "bold" },
  intro: { color: "gray", marginBottom: 8 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "royalblue",
    gap: 4,
  },
  cardPressed: { opacity: 0.6 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardDescription: { color: "gray" },
});
