import { useEffect, useState } from "react";

// @ts-ignore
import { getAvatarFrames } from "~/lib/monsterid/monsterid";

const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

interface Props {
  value: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  [key: string]: any;
}

export default function MonsterImg({
  value,
  width,
  height,
  style,
  ...props
}: Props) {
  const [frames, setFrames] = useState([EMPTY_IMAGE]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setFrames([EMPTY_IMAGE]);
    setFrameIndex(0);

    getAvatarFrames(value, width, height).then((nextFrames: string[]) => {
      if (!cancelled && nextFrames.length > 0) {
        setFrames(nextFrames);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [height, value, width]);

  useEffect(() => {
    if (frames.length < 2) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 240);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [frames]);

  return (
    <img
      src={frames[frameIndex] || EMPTY_IMAGE}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated", objectFit: "contain", ...style }}
      {...props}
    />
  );
}
