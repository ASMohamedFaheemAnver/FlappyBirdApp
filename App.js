import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
} from "react-native-reanimated";

const GRAVITY = 1000;

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
  const birdY = useSharedValue(0);
  const birdYVelocity = useSharedValue(100);

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

  return (
    <Canvas
      style={{ width, height }}
      onTouchStart={() => {
        birdYVelocity.value = -300;
      }}
    >
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

      {/* Bird */}
      <Image
        image={bird}
        x={width / 4}
        y={birdY}
        width={birdWidth}
        height={birdHeight}
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
    </Canvas>
  );
};
export default App;
