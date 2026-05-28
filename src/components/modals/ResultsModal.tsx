import { MAIN_COLOR, RED } from "~/lib/theme";
import { _ } from "~/lib/i18n";
import { formatTime } from "~/lib/dateutil";

import ConfirmModal from "./ConfirmModal";

type Props = {
  time: number;
  xp: number;
  energyGained: number;
  accuracy: number;
  [key: string]: any;
};

export default function ResultsModal({ time, xp, energyGained, accuracy, ...props }: Props) {
  const divStyle = {
    display: "flex",
    flexDirection: "row" as "row",
    justifyContent: "space-between",
    marginTop: "1em",
  };
  const accuracyColor =
    accuracy >= 90 ? MAIN_COLOR : accuracy < 50 ? RED : undefined;
  return (
    <ConfirmModal {...props}>
      <div>
        <div style={{ marginBottom: "2em" }}>
          {_("ROUND COMPLETED!")}
          <hr />
        </div>
        <div>
          <div style={divStyle}>
            <span>{_("Total XP:")}</span>
            <span>+{xp}</span>
          </div>
          {energyGained > 0 && (
            <div style={divStyle}>
              <span>{_("Energy gained:")}</span>
              <span>+{energyGained}</span>
            </div>
          )}
          <div style={divStyle}>
            <span>{_("Accuracy:")}</span>
            <span style={{ color: accuracyColor }}>{accuracy}%</span>
          </div>
          <div style={divStyle}>
            <span>{_("Time:")}</span>
            <span>{formatTime(time)}</span>
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
}
