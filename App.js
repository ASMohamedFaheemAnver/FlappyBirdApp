import {
  Canvas,
  Group,
  Image,
  Text,
  matchFont,
  useImage,
} from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

const GRAVITY = 1000;
const JUMP_FORCE = -300;

const App = () => {
  const { width, height } = useWindowDimensions();
  const bg = useImage(require("./assets/sprites/background-day.png"));
  const bird = useImage(require("./assets/sprites/yellowbird-upflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-green.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-green-top.png"));
  const base = useImage(require("./assets/sprites/base.png"));
  const birdWidth = 64;
  const birdHeight = 48;
  const [score, setScore] = useState(0);

  const pipeOffset = 0;
  const x = useSharedValue(width - 50);
  const birdY = useSharedValue(height / 3);
  // If we need to move it we can in the future
  const birdPositionX = useSharedValue(width / 4);
  const birdYVelocity = useSharedValue(0);

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) return;
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;

    // Gravity pull will increase the velocity
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-200, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1 // Means infinity
    );
  }, []);

  // Runs on ui thread
  useAnimatedReaction(
    () => {
      return x.value;
    },
    (currentValue, previousValue) => {
      const middle = birdPositionX.value;
      if (
        currentValue !== previousValue &&
        currentValue <= middle &&
        (previousValue || 0) > middle
      ) {
        // Runs on JS thread
        // setScore((previousScore) => previousScore++);
        runOnJS(setScore)(score + 1);
      }
    }
  );
  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = JUMP_FORCE;
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [JUMP_FORCE, Math.abs(JUMP_FORCE)],
          [-0.3, 0.3],
          Extrapolation.CLAMP // Cut edges to the given range
        ),
      },
    ];
  });

  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + birdWidth / 2, y: birdY.value + birdHeight / 2 };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          {/* Background */}
          <Image image={bg} width={width} height={height} fit={"cover"} />
          {/* Pipe */}
          <Image
            image={pipeTop}
            y={-320 - pipeOffset}
            x={x}
            width={104}
            height={640}
          />
          <Image
            image={pipeBottom}
            y={height - 320 - pipeOffset}
            x={x}
            width={104}
            height={640}
          />

          {/* Base */}
          <Image
            image={base}
            width={width}
            height={150}
            y={height - 75}
            x={0}
            fit={"cover"}
          />

          {/* Bird */}
          <Group
            // origin={{
            // x: width / 4,
            // y: birdY.value,
            // }}
            origin={birdOrigin}
            transform={birdTransform}
          >
            <Image
              image={bird}
              x={birdPositionX}
              y={birdY}
              width={birdWidth}
              height={birdHeight}
            />
          </Group>
          {/* Score */}
          <Text x={25} y={75} text={score.toString()} font={font} />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
