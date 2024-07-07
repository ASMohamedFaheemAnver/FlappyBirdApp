import { Canvas, Group, Image, useImage } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
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

  const pipeOffset = 0;
  const x = useSharedValue(width - 50);
  const birdY = useSharedValue(height / 3);
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
              x={width / 4}
              y={birdY}
              width={birdWidth}
              height={birdHeight}
            />
          </Group>
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
