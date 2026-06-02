import { useState, useEffect, useMemo, useCallback } from "react";
import PixelThumbsupSolid from "~icons/pixel/thumbsup-solid";
import PixelThumbsdownSolid from "~icons/pixel/thumbsdown-solid";
import PixelCrownSolid from "~icons/pixel/crown-solid";
import PixelSparklesSolid from "~icons/pixel/sparkles-solid";
import PixelBoltSolid from "~icons/pixel/bolt-solid";
import PixelRefreshSolid from "~icons/pixel/refresh-solid";

import { _ } from "~/lib/i18n";
import { getTTSEnabled, getSFXEnabled } from "~/lib/storage";
import { successSfx, errorSfx, clickSfx } from "~/lib/sounds";
import { MASTERED_STREAK, getCard, sendMonsterUpdate } from "~/lib/game";
import { tts } from "~/lib/tts";
import {
  MAIN_COLOR,
  RED,
  BRIGHT_RED,
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

const WORD_SEGMENT_REGEX = /[\p{L}\p{N}]+/gu;

type ListeningSegment =
  | { type: "separator"; text: string }
  | { type: "word"; text: string; answerIndex: number };

function getListeningSegments(sentence: string): ListeningSegment[] {
  const segments: ListeningSegment[] = [];
  let lastIndex = 0;
  let answerIndex = 0;
  WORD_SEGMENT_REGEX.lastIndex = 0;
  let match = WORD_SEGMENT_REGEX.exec(sentence);
  while (match) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({
        type: "separator",
        text: sentence.slice(lastIndex, start),
      });
    }
    segments.push({
      type: "word",
      text: match[0],
      answerIndex: answerIndex++,
    });
    lastIndex = start + match[0].length;
    match = WORD_SEGMENT_REGEX.exec(sentence);
  }
  if (lastIndex < sentence.length) {
    segments.push({ type: "separator", text: sentence.slice(lastIndex) });
  }
  return segments;
}

function normalizeListeningAnswer(text: string): string {
  return text.normalize("NFKC").trim().toLocaleLowerCase();
}

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
  const listeningMode = session.mode === "listening";
  const ttsEnabled = getTTSEnabled();
  const ttsActive = ttsEnabled || listeningMode;
  const sfxEnabled = getSFXEnabled();
  const { sentence, meanings } = getCard(monster.id);
  const listeningSegments = useMemo(
    () => getListeningSegments(sentence),
    [sentence],
  );
  const [listeningAnswers, setListeningAnswers] = useState(() =>
    listeningSegments
      .filter(
        (segment): segment is Extract<ListeningSegment, { type: "word" }> =>
          segment.type === "word",
      )
      .map(() => ""),
  );

  const showingResults = !!modal;

  useEffect(() => {
    if (
      ttsActive &&
      (defaultMode || listeningMode) &&
      !showingResults &&
      !document.hidden
    ) {
      tts(sentence);
    }
  }, [defaultMode, listeningMode, sentence, showingResults, ttsActive]);

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
    if (listeningMode) {
      setShow(true);
      return;
    }
    if (ttsActive && !defaultMode) {
      tts(sentence);
    } else if (sfxEnabled) {
      clickSfx.play();
    }
    setShow(true);
  }, [defaultMode, listeningMode, sentence, sfxEnabled, ttsActive]);

  const onMonsterClicked = useCallback(() => {
    if (defaultMode || listeningMode || show) tts(sentence);
  }, [defaultMode, listeningMode, show, sentence]);
  const onRepeatTts = useCallback(() => tts(sentence), [sentence]);
  const updateListeningAnswer = useCallback((index: number, value: string) => {
    setListeningAnswers((current) =>
      current.map((answer, currentIndex) =>
        currentIndex === index ? value : answer,
      ),
    );
  }, []);

  const meaningsComp = useMemo(
    () => <Meanings key={monster.id} meanings={meanings} />,
    [monster.id],
  );

  const sentenceSize = sentence.length > 80 ? "0.9em" : undefined;
  const listeningAnswerStyle = useMemo(
    () => ({
      background: "transparent",
      border: "none",
      borderBottom: `2px solid ${TEXT_PRIMARY}`,
      borderRadius: 0,
      color: TEXT_PRIMARY,
      fontFamily: "inherit",
      fontSize: sentenceSize || "1em",
      lineHeight: "1.6em",
      margin: "0 0.15em",
      minWidth: "3ch",
      outline: "none",
      padding: "0.2em 0",
      textAlign: "center" as "center",
      cursor: "text",
    }),
    [sentenceSize],
  );
  const listeningCardContent = useMemo(
    () => (
      <div>
        <div
          className="selectable"
          style={{
            fontSize: sentenceSize,
            lineHeight: "2em",
            whiteSpace: "pre-wrap",
          }}
        >
          {listeningSegments.map((segment, index) => {
            if (segment.type === "separator") {
              return <span key={`sep-${index}`}>{segment.text}</span>;
            }

            const answer = listeningAnswers[segment.answerIndex] || "";
            const correct =
              normalizeListeningAnswer(answer) ===
              normalizeListeningAnswer(segment.text);
            const displayAnswer = answer.trim() || "_".repeat(segment.text.length);

            if (show) {
              return correct ? (
                <span key={`word-${index}`} style={{ color: MAIN_COLOR }}>
                  {segment.text}
                </span>
              ) : (
                <span key={`word-${index}`}>
                  <span
                    style={{
                      color: RED,
                      textDecoration: "line-through",
                    }}
                  >
                    {displayAnswer}
                  </span>{" "}
                  <span style={{ color: MAIN_COLOR }}>{segment.text}</span>
                </span>
              );
            }

            return (
              <input
                key={`word-${index}`}
                value={answer}
                placeholder={"_".repeat(segment.text.length)}
                aria-label={`${_("Listening Practice")} ${segment.answerIndex + 1}`}
                onChange={(event) =>
                  updateListeningAnswer(segment.answerIndex, event.currentTarget.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") onShow();
                }}
                style={{
                  ...listeningAnswerStyle,
                  width: `${Math.max(segment.text.length, 3)}ch`,
                }}
              />
            );
          })}
        </div>
        <div style={{ marginTop: "1em" }}>
          <button
            onClick={onRepeatTts}
            style={{
              background: TEXT_PRIMARY,
              color: BG_PRIMARY,
              borderRadius: "5px",
              border: "none",
              padding: "0.5em 0.8em",
              fontWeight: "bold",
            }}
          >
            {_("Repeat TTS")}
            <PixelRefreshSolid />
          </button>
        </div>
        {show && (
          <>
            <div style={{ paddingTop: "0.5em", paddingBottom: "0.5em" }}>
              <span style={{ fontSize: "1.5em" }}>↓</span>
            </div>
            {meaningsComp}
          </>
        )}
      </div>
    ),
    [
      listeningAnswers,
      listeningAnswerStyle,
      listeningSegments,
      meaningsComp,
      onRepeatTts,
      onShow,
      show,
      sentenceSize,
      updateListeningAnswer,
    ],
  );

  const statusBarM = useMemo(
    () => <StatusBar session={session} style={statusBarStyle} />,
    [session],
  );
  const cardDetails = listeningMode
    ? listeningCardContent
    : defaultMode
      ? undefined
      : meaningsComp;
  const monsterM = useMemo(
    () => (
      <MonsterCard
        monster={monster}
        sentence={sentence}
        meanings={cardDetails}
        onMonsterClicked={onMonsterClicked}
      />
    ),
    [
      cardDetails,
      defaultMode,
      listeningMode,
      monster.id,
      monster.seen,
      onMonsterClicked,
      sentence,
    ],
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
              {skillEffects.map((effect, index) => {
                const emphasize =
                  effect.source === "criticalHit" ||
                  effect.source === "incorrectAnswer";
                return (
                  <div
                    key={effect.id}
                    className="skill-effect-counter"
                    style={{
                      top: `${index * (emphasize ? 1.4 : 1.1)}em`,
                      fontSize: `${emphasize ? 1.2 : 1.1}em`,
                      fontWeight: emphasize ? "bold" : undefined,
                      color: emphasize
                        ? BRIGHT_RED
                        : effect.stat === "energy"
                          ? MAIN_COLOR
                          : BLUE,
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
                );
              })}
              {show && !listeningMode && (
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
                      color: listeningMode ? BG_PRIMARY : "white",
                      background: listeningMode ? MAIN_COLOR : "#32526d",
                    }}
                  >
                    {_(listeningMode ? "Check" : "Reveal")}
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
