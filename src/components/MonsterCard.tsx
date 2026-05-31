import { MASTERED_STREAK } from "~/lib/game";
import { _ } from "~/lib/i18n";
import { MAIN_COLOR, GOLDEN, TEXT_TERTIARY, BG_PRIMARY } from "~/lib/theme";

import MonsterImg from "~/components/MonsterImg";

interface Props {
  monster: Monster;
  sentence: string;
  meanings?: React.ReactNode;
  onMonsterClicked?: () => void;
}

export default function MonsterCard({
  monster,
  sentence,
  meanings,
  onMonsterClicked,
}: Props) {
  const label = monster.seen
    ? _("lvl.{{l}}").replace("{{l}}", String(monster.streak + 1))
    : _("NEW");
  const labelBg =
    monster.streak >= MASTERED_STREAK
      ? GOLDEN
      : monster.seen
        ? TEXT_TERTIARY
        : MAIN_COLOR;
  const labelStyle = {
    color: BG_PRIMARY,
    background: labelBg,
    borderRadius: "5px",
    padding: "0.3em",
    fontWeight: "bold",
    fontSize: "0.9em",
  };
  const fontSize = sentence.length > 80 ? "0.9em" : undefined;

  return (
    <div>
      <MonsterImg
        value={sentence}
        width={80}
        height={80}
        style={{ marginBottom: "0.5em" }}
        onClick={onMonsterClicked}
      />
      <div style={{ marginBottom: "0.8em" }}>
        <span style={labelStyle}>{label}</span>
      </div>
      {meanings ? (
        meanings
      ) : (
        <div className="selectable" style={{ fontSize, lineHeight: "1.5em" }}>
          {sentence}
        </div>
      )}
    </div>
  );
}
