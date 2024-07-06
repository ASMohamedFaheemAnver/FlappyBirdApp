import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";
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

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Image image={bg} width={width} height={height} fit={"cover"} />
      {/* Pipe */}
      <Image
        image={pipeTop}
        y={-320 - pipeOffset}
        x={width / 2}
        width={104}
        height={640}
      />
      <Image
        image={pipeBottom}
        y={height - 320 - pipeOffset}
        x={width / 2}
        width={104}
        height={640}
      />

      {/* Bird */}
      <Image
        image={bird}
        x={width / 4}
        y={height / 2}
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
