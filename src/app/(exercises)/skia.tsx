import {
  BackdropFilter,
  Blur,
  Canvas,
  Circle,
  Fill,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  rect,
  rrect,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const GLASS_HEIGHT = 360;
const CARD_WIDTH = 260;
const CARD_HEIGHT = 150;
const CARD_RADIUS = 24;
const CHART_HEIGHT = 200;
const CHART_PADDING = 16;
// Sample values for the drawing demo, not real data.
const CHART_VALUES = [12, 18, 14, 25, 22, 31, 28, 40, 35, 48, 44, 56];

export default function SkiaScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Skia graphics</Text>
      <Text style={styles.intro}>
        Everything below is drawn on a Skia canvas instead of native views.
      </Text>

      <Text style={styles.sectionTitle}>1 · Glass card</Text>
      <Text style={styles.intro}>
        Drag the card over the moving shapes: the blur only affects what is
        drawn behind it in the same canvas.
      </Text>
      <GlassDemo />

      <Text style={styles.sectionTitle}>2 · Line chart</Text>
      <Text style={styles.intro}>
        A path with a gradient area under it, drawn in with the path `end` value
        (sample data).
      </Text>
      <LineChartDemo />
    </ScrollView>
  );
}

function GlassDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - 32;

  const cardX = useSharedValue((width - CARD_WIDTH) / 2);
  const cardY = useSharedValue((GLASS_HEIGHT - CARD_HEIGHT) / 2);

  const pinkX = useSharedValue(width * 0.25);
  const violetX = useSharedValue(width * 0.75);
  const cyanY = useSharedValue(GLASS_HEIGHT * 0.3);

  useEffect(() => {
    pinkX.set(
      withRepeat(withTiming(width * 0.6, { duration: 4000 }), -1, true),
    );
    violetX.set(
      withRepeat(withTiming(width * 0.3, { duration: 5500 }), -1, true),
    );
    cyanY.set(
      withRepeat(withTiming(GLASS_HEIGHT * 0.75, { duration: 3500 }), -1, true),
    );
  }, [width, pinkX, violetX, cyanY]);

  const clip = useDerivedValue(() =>
    rrect(
      rect(cardX.get(), cardY.get(), CARD_WIDTH, CARD_HEIGHT),
      CARD_RADIUS,
      CARD_RADIUS,
    ),
  );

  const drag = Gesture.Pan().onChange((event) => {
    cardX.set(
      Math.min(Math.max(cardX.get() + event.changeX, 0), width - CARD_WIDTH),
    );
    cardY.set(
      Math.min(
        Math.max(cardY.get() + event.changeY, 0),
        GLASS_HEIGHT - CARD_HEIGHT,
      ),
    );
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardX.get() }, { translateY: cardY.get() }],
  }));

  return (
    <GestureDetector gesture={drag}>
      <View style={[styles.glassStage, { width }]}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color="#0F0F1A" />
          <Circle cx={pinkX} cy={110} r={70} color="#FF007F" />
          <Circle cx={violetX} cy={250} r={90} color="#7F00FF" />
          <Circle cx={width / 2} cy={cyanY} r={50} color="#00D4FF" />

          <BackdropFilter filter={<Blur blur={20} />} clip={clip}>
            <Fill color="rgba(255, 255, 255, 0.12)" />
          </BackdropFilter>
          <RoundedRect
            x={cardX}
            y={cardY}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            r={CARD_RADIUS}
            style="stroke"
            strokeWidth={1}
            color="rgba(255, 255, 255, 0.3)"
          />
        </Canvas>

        <Animated.View
          style={[styles.glassContent, cardStyle]}
          pointerEvents="none"
        >
          <Text style={styles.glassTitle}>Skia Glass</Text>
          <Text style={styles.glassText}>
            Hardware-accelerated blur, drawn behind this card.
          </Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

function LineChartDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - 32;
  const progress = useSharedValue(0);

  const { linePath, areaPath } = useMemo(() => {
    const maxValue = Math.max(...CHART_VALUES);
    const stepX = (width - CHART_PADDING * 2) / (CHART_VALUES.length - 1);
    const points = CHART_VALUES.map((value, index) => ({
      x: CHART_PADDING + index * stepX,
      y:
        CHART_HEIGHT -
        CHART_PADDING -
        (value / maxValue) * (CHART_HEIGHT - CHART_PADDING * 2),
    }));

    const lineBuilder = Skia.PathBuilder.Make().moveTo(
      points[0].x,
      points[0].y,
    );
    points.slice(1).forEach((point) => lineBuilder.lineTo(point.x, point.y));
    const line = lineBuilder.build();

    const area = Skia.PathBuilder.MakeFromPath(line)
      .lineTo(points[points.length - 1].x, CHART_HEIGHT - CHART_PADDING)
      .lineTo(points[0].x, CHART_HEIGHT - CHART_PADDING)
      .close()
      .build();

    return { linePath: line, areaPath: area };
  }, [width]);

  const areaOpacity = useDerivedValue(() => progress.get());

  function play() {
    progress.set(0);
    progress.set(withTiming(1, { duration: 1400 }));
  }

  useEffect(() => {
    progress.set(withTiming(1, { duration: 1400 }));
  }, [progress]);

  return (
    <View style={styles.chartCard}>
      <Canvas style={{ width, height: CHART_HEIGHT }}>
        <Path path={areaPath} opacity={areaOpacity}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, CHART_HEIGHT)}
            colors={["rgba(124, 58, 237, 0.45)", "rgba(124, 58, 237, 0)"]}
          />
        </Path>
        <Path
          path={linePath}
          style="stroke"
          strokeWidth={3}
          strokeJoin="round"
          strokeCap="round"
          color="#7C3AED"
          start={0}
          end={progress}
        />
      </Canvas>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Replay the chart animation"
        style={styles.replay}
        onPress={play}
      >
        <Text style={styles.replayText}>Replay</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  heading: { fontSize: 28, fontWeight: "700" },
  intro: { fontSize: 14, color: "#555555" },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  glassStage: {
    height: GLASS_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
  },
  glassContent: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 20,
    justifyContent: "center",
  },
  glassTitle: { fontSize: 22, fontWeight: "700", color: "#ffffff" },
  glassText: { marginTop: 6, fontSize: 14, color: "rgba(255, 255, 255, 0.75)" },
  chartCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 12,
  },
  replay: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111111",
  },
  replayText: { color: "#ffffff", fontWeight: "600" },
});
