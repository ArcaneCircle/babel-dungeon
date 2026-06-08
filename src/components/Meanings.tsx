import { useState } from "react";
import PixelRefreshSolid from "~icons/pixel/refresh-solid";

import { clickSfx } from "~/lib/sounds";
import { getSFXEnabled } from "~/lib/storage";

import BorderedCard from "~/components/BorderedCard";

const switchBtnStyle = {
  background: "white",
  color: "black",
  border: "none",
  padding: "0.4em",
  fontWeight: "bold",
  marginTop: "0.3em",
};

export default function Meanings({ meanings }: { meanings: string[] }) {
  const [index, setIndex] = useState(0);
  const count = meanings.length;
  const onSwitch = () => {
    if (getSFXEnabled()) clickSfx.play();
    setIndex((index) => (index + 1) % count);
  };
  const fontSize = meanings[index].length > 80 ? "0.9em" : undefined;

  return (
    <BorderedCard
      textColor="black"
      backgroundColor="#f6ca9f"
      innerBorderColor="#e69c69"
      outerBorderColor="#bf6f4a"
    >
      <span className="selectable" style={{ fontSize, lineHeight: "1.5em" }}>
        {meanings[index]}
      </span>{" "}
      {count > 1 ? (
        <button
          className={"pixel-corners4"}
          style={switchBtnStyle}
          onClick={onSwitch}
        >
          [{index + 1}/{count}]
          <PixelRefreshSolid />
        </button>
      ) : (
        ""
      )}
    </BorderedCard>
  );
}
