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
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

const GRAVITY = 1000;
const JUMP_FORCE = -300;
const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();
  const bg = useImage(require("./assets/sprites/background-day.png"));
  const bird = useImage(require("./assets/sprites/yellowbird-upflap.png"));
  const pipeBottom = useImage(require("./assets/sprites/pipe-green.png"));
  const pipeTop = useImage(require("./assets/sprites/pipe-green-top.png"));
  const base = useImage(require("./assets/sprites/base.png"));
  const birdWidth = 64;
  const birdHeight = 48;
  const baseHeight = 75;
  const [score, setScore] = useState(0);

  const pipeOffset = useSharedValue(0);
  const pipeX = useSharedValue(width - 50);
  const pipesSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2]);
  });
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);

  const birdY = useSharedValue(height / 3);
  const gameOver = useSharedValue(false);

  // If we need to move it we can in the future
  const birdX = useSharedValue(width / 4);
  const birdYVelocity = useSharedValue(0);

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) return;
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;

    // Gravity pull will increase the velocity
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  // const moveTheMap = () => {
  //   pipeX.value =
  //   withRepeat(
  //     withSequence(
  //       withTiming(-200, { duration: 3000, easing: Easing.linear }),
  //       withTiming(width, { duration: 0 })
  //     ),
  //     -1 // Means infinity
  //   );
  // };

  const moveTheMap = () => {
    pipeX.value = withSequence(
      withTiming(width, { duration: 0 }),
      withTiming(-200, {
        duration: 3000 / pipesSpeed.value,
        easing: Easing.linear,
      }),
      withTiming(width, { duration: 0 })
    );
  };

  useEffect(() => {
    moveTheMap();
  }, []);

  // Scoring system
  // Runs on ui thread
  useAnimatedReaction(
    () => {
      return pipeX.value;
    },
    (currentValue, previousValue) => {
      const middle = birdX.value;
      // change offset for the position of the next gap
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        cancelAnimation(pipeX);
        runOnJS(moveTheMap)();
      }

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

  const obstacles = useDerivedValue(() => [
    // bottom pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // top pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  const isPointCollidingWithRect = (point, rect) => {
    "worklet";
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top AND
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX.value + birdWidth / 2,
        y: birdY.value + birdHeight / 2,
      };
      // Ground collision detection
      if (currentValue > height - baseHeight - birdHeight || currentValue < 0) {
        gameOver.value = true;
      }
      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );
      if (isColliding) {
        gameOver.value = true;
      }
    }
  );

  // Allow it to call it from UI thread
  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
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
    if (gameOver.value) {
      restartGame();
    } else {
      birdYVelocity.value = JUMP_FORCE;
    }
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
            y={topPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeight}
          />
          <Image
            image={pipeBottom}
            y={bottomPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeight}
          />

          {/* Base */}
          <Image
            image={base}
            width={width}
            height={150}
            y={height - baseHeight}
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
              x={birdX}
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
