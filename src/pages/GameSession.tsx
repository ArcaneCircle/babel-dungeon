import { useState, useEffect, useMemo, useCallback } from "react";
import PixelThumbsupSolid from "~icons/pixel/thumbsup-solid";
import PixelThumbsdownSolid from "~icons/pixel/thumbsdown-solid";
import PixelCrownSolid from "~icons/pixel/crown-solid";
import PixelSparklesSolid from "~icons/pixel/sparkles-solid";
import PixelBoltSolid from "~icons/pixel/bolt-solid";

import { _ } from "~/lib/i18n";
import { getTTSEnabled, getSFXEnabled } from "~/lib/storage";
import { successSfx, errorSfx, clickSfx } from "~/lib/sounds";
import { MASTERED_STREAK, getCard, sendMonsterUpdate } from "~/lib/game";
import { tts } from "~/lib/tts";
import {
  MAIN_COLOR,
  RED,
  BLUE,
  GOLDEN,
  BG_PRIMARY,
  TEXT_PRIMARY,
} from "~/lib/theme";

import { ModalContext } from "~/components/modals/Modal";
import MonsterCard from "~/components/MonsterCard";
import Meanings from "~/components/Meanings";
import StatusBar from "~/components/StatusBar";
import LevelUpModal from "~/components/modals/LevelUpModal";
import ResultsModal from "~/components/modals/ResultsModal";

const baseBtn = {
  color: TEXT_PRIMARY,
  border: "none",
  padding: "0.6em 0.5em",
  fontSize: "1.5em",
  flexGrow: 1,
};

const btnContainerStyle = {
  display: "flex",
  flexDirection: "row" as "row",
  flexWrap: "nowrap" as "nowrap",
};

const statusBarStyle = {
  position: "sticky",
  top: 0,
  backgroundColor: BG_PRIMARY,
};

type FloatingSkillEffect = SkillEffectGain & {
  id: number;
};

interface Props {
  setShowingResults: (showing: boolean) => void;
  session: Session;
  player: Player;
}

export default function GameSession({
  setShowingResults,
  session,
  player,
}: Props) {
  const monster =
    session.pending[0] ||
    session.failed[0] ||
    session.correct[session.correct.length - 1];
  return (
    <Quiz
      key={`${monster.id}-${monster.lastFailed ?? 0}`}
      session={session}
      player={player}
      monster={monster}
      setShowingResults={setShowingResults}
    />
  );
}

function Quiz({
  setShowingResults,
  session,
  player,
  monster,
}: Props & { monster: Monster }) {
  const [show, setShow] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modal, setModal] = useState(null as ModalPayload | null);
  const [skillEffects, setSkillEffects] = useState([] as FloatingSkillEffect[]);

  const defaultMode =
    session.mode === "easy" ||
    (session.mode === "normal" && monster.streak < MASTERED_STREAK);
  const ttsEnabled = getTTSEnabled();
  const sfxEnabled = getSFXEnabled();
  const { sentence, meanings } = getCard(monster.id);

  const showingResults = !!modal;

  useEffect(() => {
    if (ttsEnabled && defaultMode && !showingResults && !document.hidden) {
      tts(sentence);
    }
  }, [monster, showingResults]);

  const onSkillEffectDone = useCallback(
    (id: number) =>
      setSkillEffects((value) => value.filter((effect) => effect.id !== id)),
    [],
  );
  const pushSkillEffects = useCallback((effects: SkillEffectGain[]) => {
    if (!effects.length) return;
    setSkillEffects((current) => [
      ...current,
      ...effects.map((effect) => ({
        ...effect,
        id: Date.now() + Math.random(),
      })),
    ]);
  }, []);
  const onFailed = useCallback(() => {
    setProcessing(true);
    setShow(false);
    if (sfxEnabled) errorSfx.play();
    const { skillEffects } = sendMonsterUpdate(monster, 0);
    pushSkillEffects(skillEffects);
  }, [monster, sfxEnabled, pushSkillEffects]);
  const onCorrect = useCallback(() => {
    setProcessing(true);
    if (sfxEnabled) successSfx.play();
    const { modal: mod, skillEffects } = sendMonsterUpdate(monster, 1);
    pushSkillEffects(skillEffects);
    setShowingResults(!!mod);
    setModal(mod);
  }, [monster, sfxEnabled, pushSkillEffects]);

  const goldenTouch = player ? player.skills.goldenTouch : 0;
  const onMastered = useCallback(() => {
    setProcessing(true);
    if (sfxEnabled) successSfx.play();
    const { modal: mod, skillEffects } = sendMonsterUpdate(
      monster,
      5 + player.skills.goldenTouch,
    );
    pushSkillEffects(skillEffects);
    setShowingResults(!!mod);
    setModal(mod);
  }, [monster, sfxEnabled, goldenTouch, pushSkillEffects]);

  const onShow = useCallback(() => {
    if (ttsEnabled && !defaultMode) {
      tts(sentence);
    } else if (sfxEnabled) {
      clickSfx.play();
    }
    setShow(true);
  }, [monster.id, ttsEnabled, sfxEnabled, defaultMode]);

  const meaningsComp = useMemo(
    () => <Meanings key={monster.id} meanings={meanings} />,
    [monster.id],
  );

  const sentenceSize = sentence.length > 80 ? "0.9em" : undefined;

  const statusBarM = useMemo(
    () => <StatusBar session={session} style={statusBarStyle} />,
    [session],
  );
  const monsterM = useMemo(
    () => (
      <MonsterCard
        monster={monster}
        sentence={sentence}
        meanings={defaultMode ? undefined : meaningsComp}
      />
    ),
    [monster.id, monster.seen],
  );

  const setOpen = useCallback(
    (show: boolean) => {
      if (show) {
        setShowingResults(!!modal);
        setModal(modal);
      } else if (modal && "next" in modal) {
        setShowingResults(!!modal.next);
        setModal(modal.next);
      } else {
        setShowingResults(false);
        setModal(null);
      }
    },
    [modal],
  );

  const pendingCount = session.failed.length + session.pending.length;

  return (
    <>
      <ModalContext.Provider value={{ isOpen: !!modal, setOpen }}>
        {modal === null ? null : modal.type === "levelUp" ? (
          <LevelUpModal
            level={modal.newLevel}
            restoredEnergy={modal.restoredEnergy}
            skillPoints={modal.skillPoints}
          />
        ) : modal.type === "results" ? (
          <ResultsModal
            time={modal.time}
            xp={modal.xp}
            onFireXp={modal.onFireXp}
            accuracy={modal.accuracy}
          />
        ) : null}
      </ModalContext.Provider>

      <div style={{ textAlign: "center" }}>
        {statusBarM}
        {pendingCount > 0 && (
          <>
            <div
              style={{
                padding: "0.5em 1em",
                marginBottom: "6em",
                position: "relative",
              }}
            >
              {monsterM}
              {skillEffects.map((effect, index) => (
                <div
                  key={effect.id}
                  className="skill-effect-counter"
                  style={{
                    fontSize: `${effect.source === "criticalHit" ? 1.2 : 1.1}em`,
                    top: `${index * 1.1}em`,
                    color:
                      effect.source === "incorrectAnswer"
                        ? RED
                        : effect.source === "criticalHit"
                          ? BLUE
                          : effect.stat === "energy"
                            ? GOLDEN
                            : undefined,
                  }}
                  onAnimationEnd={() => onSkillEffectDone(effect.id)}
                >
                  {effect.source === "incorrectAnswer" ? (
                    "MISS"
                  ) : (
                    <>
                      +{effect.amount}
                      {effect.stat === "xp" ? (
                        <PixelSparklesSolid />
                      ) : (
                        <PixelBoltSolid />
                      )}
                    </>
                  )}
                </div>
              ))}
              {show && (
                <>
                  <div style={{ paddingTop: "0.5em", paddingBottom: "0.5em" }}>
                    <span style={{ fontSize: "1.5em" }}>↓</span>
                  </div>
                  {defaultMode ? (
                    meaningsComp
                  ) : (
                    <div
                      className="selectable"
                      style={{ fontSize: sentenceSize }}
                    >
                      {sentence}
                    </div>
                  )}
                </>
              )}
            </div>
            <div
              style={{
                position: "fixed",
                bottom: "0",
                width: "100%",
                backgroundColor: BG_PRIMARY,
              }}
            >
              {show ? (
                <>
                  <p style={{ fontSize: "0.8em", padding: "0 1em" }}>
                    {_("Did you know it?")}
                  </p>
                  <div style={btnContainerStyle}>
                    <button
                      style={{ ...baseBtn, background: RED }}
                      onClick={onFailed}
                      disabled={processing}
                    >
                      <PixelThumbsdownSolid />
                    </button>
                    <button
                      style={{ ...baseBtn, background: GOLDEN }}
                      onClick={onMastered}
                      disabled={processing}
                    >
                      <PixelCrownSolid />
                    </button>
                    <button
                      style={{ ...baseBtn, background: MAIN_COLOR }}
                      onClick={onCorrect}
                      disabled={processing}
                    >
                      <PixelThumbsupSolid />
                    </button>
                  </div>
                </>
              ) : (
                <div style={btnContainerStyle}>
                  <button
                    onClick={onShow}
                    style={{
                      ...baseBtn,
                      color: "white",
                      background: "#32526d",
                    }}
                  >
                    {_("Reveal")}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
