import { useCallback } from "react";
import PixelBoltSolid from "~icons/pixel/bolt-solid";

import { _ } from "~/lib/i18n";
import { RED } from "~/lib/theme";
import { getPlayEnergyCost, startNewGame } from "~/lib/game";

import ConfirmModal from "~/components/modals/ConfirmModal";
import MenuPreference from "~/components/MenuPreference";

function MenuItem({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: "1em" }}>{children}</div>;
}

type Props = {
  player: Player;
  onNoEnergy: () => void;
  [key: string]: any;
};

export default function GameModeModal({ player, onNoEnergy, ...props }: Props) {
  const energyCostEasy = getPlayEnergyCost(
    "easy",
    player.toReview,
    player.skills.berserker,
  );
  const energyCostNormal = getPlayEnergyCost(
    "normal",
    player.toReview,
    player.skills.berserker,
  );
  const energyCostListening = getPlayEnergyCost(
    "listening",
    player.toReview,
    player.skills.berserker,
  );
  const playEasy = useCallback(() => {
    if (!startNewGame("easy", energyCostEasy)) {
      onNoEnergy();
    }
  }, [energyCostEasy, onNoEnergy]);
  const playNormal = useCallback(() => {
    if (!startNewGame("normal", energyCostNormal)) {
      onNoEnergy();
    }
  }, [energyCostNormal, onNoEnergy]);
  const playListening = useCallback(() => {
    if (!startNewGame("listening", energyCostListening)) {
      onNoEnergy();
    }
  }, [energyCostListening, onNoEnergy]);

  const easyColor = player.energy < energyCostEasy ? RED : undefined;
  const normalColor = player.energy < energyCostNormal ? RED : undefined;
  const listeningColor = player.energy < energyCostListening ? RED : undefined;

  return (
    <ConfirmModal buttonText={_("Cancel")} {...props}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "2em" }}>
          {_("GAME MODE")}
          <hr />
        </div>
        {player.toReview > 0 && (
          <MenuItem>
            <MenuPreference
              name={_("Easy")}
              state={
                <div style={{ color: easyColor }}>
                  {`${-energyCostEasy}`}
                  <PixelBoltSolid />
                </div>
              }
              onClick={playEasy}
            />
          </MenuItem>
        )}
        <MenuItem>
          <MenuPreference
            name={_("Normal")}
            state={
              <div style={{ color: normalColor }}>
                {`${-energyCostNormal}`}
                <PixelBoltSolid />
              </div>
            }
            onClick={playNormal}
          />
        </MenuItem>
        <MenuItem>
          <MenuPreference
            name={_("Listening Practice")}
            state={
              <div style={{ color: listeningColor }}>
                {`${-energyCostListening}`}
                <PixelBoltSolid />
              </div>
            }
            onClick={playListening}
          />
        </MenuItem>
      </div>
    </ConfirmModal>
  );
}
