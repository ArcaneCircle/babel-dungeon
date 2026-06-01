import { useEffect, useMemo, useState } from "react";

import { getAvatarFrames } from "~/lib/monsterid/monsterid";

const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";
const IDLE_FRAME_MS = 240;
const BASE_STYLE: React.CSSProperties = {
  imageRendering: "pixelated",
  objectFit: "contain",
  background: "url(card-bg.png)",
  padding: "10px",
  cursor: "pointer",
};

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
  const {
    draggable: _draggable,
    onContextMenu: _onContextMenu,
    ...safeProps
  } = props;
  const [frames, setFrames] = useState([EMPTY_IMAGE]);
  const [frameIndex, setFrameIndex] = useState(0);
  const mergedStyle = useMemo(() => ({ ...BASE_STYLE, ...style }), [style]);

  useEffect(() => {
    let cancelled = false;

    setFrames([EMPTY_IMAGE]);
    setFrameIndex(0);

    getAvatarFrames(value, width, height)
      .then((nextFrames: string[]) => {
        if (!cancelled && nextFrames.length > 0) {
          setFrames(nextFrames);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFrames([EMPTY_IMAGE]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [height, value, width]);

  useEffect(() => {
    if (frames.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, IDLE_FRAME_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [frames]);

  return (
    <img
      src={frames[frameIndex] || EMPTY_IMAGE}
      width={width}
      height={height}
      {...safeProps}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={mergedStyle}
    />
  );
}
