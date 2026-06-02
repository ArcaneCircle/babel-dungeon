import PixelThumbsupSolid from "~icons/pixel/thumbsup-solid";
import PixelThumbsdownSolid from "~icons/pixel/thumbsdown-solid";
import PixelFaceThinkingSolid from "~icons/pixel/face-thinking-solid";

import { MAIN_COLOR, RED, GOLDEN } from "~/lib/theme";
import { _ } from "~/lib/i18n";

import BasicProgressBar from "./BasicProgressBar";

interface Props {
  session: Session;
  [key: string]: any;
}

const AlignedSpan = ({ children }: { children: React.ReactNode }) => (
  <span style={{ alignContent: "end" }}>{children}</span>
);

export default function StatusBar({ session, ...props }: Props) {
  const siblingCount = (monsters: Monster[]) =>
    monsters.reduce((acc, m) => acc + (m.siblings?.length ?? 0), 0);

  const correctCount = session.correct.length + siblingCount(session.correct);
  const failedCount = session.failed.length + siblingCount(session.failed);
  const pendingCount = session.pending.length + siblingCount(session.pending);
  const total = correctCount + failedCount + pendingCount;

  return (
    <div {...props}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: "0.5em 1em",
        }}
      >
        <AlignedSpan>
          <PixelThumbsupSolid
            style={{ color: MAIN_COLOR, marginRight: "0.2em" }}
          />
          {correctCount}
        </AlignedSpan>
        <AlignedSpan>
          <PixelThumbsdownSolid style={{ color: RED, marginRight: "0.2em" }} />
          {failedCount}
        </AlignedSpan>
        <AlignedSpan>
          <PixelFaceThinkingSolid
            style={{ color: GOLDEN, marginRight: "0.2em" }}
          />
          {pendingCount}
        </AlignedSpan>
      </div>
      <BasicProgressBar progress={correctCount} total={total} />
    </div>
  );
}
