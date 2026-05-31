import { ReceivedStatusUpdate, SendingStatusUpdate } from "@webxdc/types";

import { SENTENCES } from "~/lib/sentences";
import { initializeSentences } from "~/lib/invertSentences";
import {
  db,
  getSession,
  setSession,
  getStreak,
  setStreak,
  getLevel,
  setLevel,
  getXp,
  setXp,
  getEnergy,
  setEnergy,
  getSkillPoints,
  setSkillPoints,
  getMotivatedSkillLevel,
  setMotivatedSkillLevel,
  getMaxEnergySkillLevel,
  setMaxEnergySkillLevel,
  getBerserkerSkillLevel,
  setBerserkerSkillLevel,
  getGoldenTouchSkillLevel,
  setGoldenTouchSkillLevel,
  getLifeStealSkillLevel,
  setLifeStealSkillLevel,
  getCriticalHitSkillLevel,
  setCriticalHitSkillLevel,
  getFastLearnerSkillLevel,
  setFastLearnerSkillLevel,
  getOnFireSkillLevel,
  setOnFireSkillLevel,
  getLastPlayed,
  setLastPlayed,
  getStudiedToday,
  setStudiedToday,
  setUnseenIndex,
  getUnseenIndex,
  setMaxSerial,
  getMaxSerial,
  importBackup,
  isValidBackup,
  getLearningLanguage,
  setLearningLanguage,
} from "~/lib/storage";

export const MAX_LEVEL = 1000;
export const PLAY_ENERGY_COST = 100;
export const MASTERED_STREAK = 5;
export const MAX_ENERGY_SKILL_MAX_LEVEL = 50;
export const BASE_MAX_ENERGY = 300;
export const MOTIVATED_BASE_RESTORE_PERCENT = 50;
export const MOTIVATED_SKILL_PER_LEVEL_PERCENT = 1;
export const MOTIVATED_SKILL_MAX_LEVEL = 50;
export const BERSERKER_SKILL_MAX_LEVEL = 50;
export const GOLDEN_TOUCH_SKILL_MAX_LEVEL = 50;
export const LIFE_STEAL_SKILL_MAX_LEVEL = 50;
export const LIFE_STEAL_BASE_CHANCE = 10;
export const LIFE_STEAL_CHANCE_PER_LEVEL = 0.5;
export const CRITICAL_HIT_SKILL_MAX_LEVEL = 50;
export const CRITICAL_HIT_BASE_CHANCE = 10;
export const CRITICAL_HIT_CHANCE_PER_LEVEL = 0.5;
export const CRITICAL_HIT_XP_MULTIPLIER = 1.5;
export const FAST_LEARNER_SKILL_MAX_LEVEL = 50;
export const ON_FIRE_SKILL_MAX_LEVEL = 50;
export const ON_FIRE_BASE_XP_PER_UPGRADE = 100;
export const ON_FIRE_STREAK_THRESHOLD = 7;

const MONSTER_UPDATE_CMD = "mon-up",
  INIT_CMD = "init",
  NEW_CMD = "new",
  SKILL_UP_CMD = "skill-up",
  LANG_CMD = "lang",
  FINISHED_CMD = "finished",
  IMPORT_CMD = "import";
const MAX_MONSTER_STREAK = 999;
let energyLastCheck = 0;
let setPlayerState = null as ((player: Player) => void) | null;
let setSessionState = (_: Session | null) => {};
let setWelcomeCompleteState = (_: boolean) => {};
const queue: ReceivedStatusUpdate<Payload>[] = [];
const pendingMonsterUpdates: Array<{
  monster: Monster;
  sessionId: number;
  xp: number;
  energyGained: number;
}> = [];
// Keep in sync with `.skill-effect-counter` animation duration in `src/App.css`.
const SKILL_EFFECT_ANIMATION_MS = 1000;
let pendingSessionStateUpdateTimeout: ReturnType<typeof setTimeout> | null =
  null;

function updateSessionState(session: Session | null, delay = 0) {
  const nextSession = session ? { ...session } : null;
  // Only the newest session update should win; cancel stale delayed updates.
  if (pendingSessionStateUpdateTimeout) {
    clearTimeout(pendingSessionStateUpdateTimeout);
    pendingSessionStateUpdateTimeout = null;
  }
  if (delay > 0) {
    pendingSessionStateUpdateTimeout = setTimeout(() => {
      setSessionState(nextSession);
      pendingSessionStateUpdateTimeout = null;
    }, delay);
    return;
  }
  setSessionState(nextSession);
}

// Initialize SENTENCES based on learning language
initializeSentences(getLearningLanguage());

// send batch of pending monster updates when user closes/minimizes the app
function flushPendingMonsterUpdates() {
  if (pendingMonsterUpdates.length === 0) return;

  const statusUpdate = {
    payload: {
      uid: window.webxdc.selfAddr,
      cmd: MONSTER_UPDATE_CMD,
      monsters: [...pendingMonsterUpdates],
    },
  } as SendingStatusUpdate<Payload>;
  window.webxdc.sendUpdate(statusUpdate, "");

  pendingMonsterUpdates.length = 0;
}

const workerLoop = async () => {
  while (queue.length > 0) {
    await processUpdate(queue.shift()!);
  }
  const now = Date.now();
  if (now - energyLastCheck >= 10000) {
    let { energy, time } = getEnergy(BASE_MAX_ENERGY);
    let changed = false;
    const recoveryDelay = 36 * 1000;
    while (
      now - time >= recoveryDelay &&
      energy < getMaxEnergy(getMaxEnergySkillLevel())
    ) {
      time += recoveryDelay;
      setEnergy(++energy, time);
      changed = true;
    }
    if (changed && setPlayerState) setPlayerState(await getPlayer());
    energyLastCheck = now;
  }
  setTimeout(workerLoop, 100);
};
setTimeout(workerLoop, 0);

export function getCard(id: number): Card {
  const [sentence, meaning] = SENTENCES[id].split("\t");
  return { id, sentence, meanings: meaning.split("|") };
}

export async function getPlayer(): Promise<Player> {
  const now = Date.now();
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = new Date(today).setDate(new Date(today).getDate() - 1);

  const seen = await db.monsters.count();
  const mastered = await db.monsters
    .where("streak")
    .aboveOrEqual(MASTERED_STREAK)
    .count();
  const toReview = await db.monsters.where("due").belowOrEqual(now).count();
  const streak = getLastPlayed() < yesterday ? 0 : getStreak();
  const studiedToday = getLastPlayed() < today ? 0 : getStudiedToday();
  const lvl = getLevel();
  const xp = getXp();
  const totalXp = lvl === MAX_LEVEL ? 0 : toNextLevelMediumFast(lvl);

  const energyState = getEnergy(BASE_MAX_ENERGY);
  const maxEnergy = getMaxEnergy(getMaxEnergySkillLevel());
  const energy = Math.min(energyState.energy, maxEnergy);
  if (energy !== energyState.energy) {
    setEnergy(energy, energyState.time);
  }

  return {
    lvl,
    xp,
    totalXp,
    energy,
    maxEnergy,
    skillPoints: getSkillPoints(),
    skills: {
      motivated: getMotivatedSkillLevel(),
      maxEnergy: getMaxEnergySkillLevel(),
      berserker: getBerserkerSkillLevel(),
      goldenTouch: getGoldenTouchSkillLevel(),
      lifeSteal: getLifeStealSkillLevel(),
      criticalHit: getCriticalHitSkillLevel(),
      fastLearner: getFastLearnerSkillLevel(),
      onFire: getOnFireSkillLevel(),
    },
    streak,
    studiedToday,
    toReview,
    seen,
    mastered,
    total: SENTENCES.length,
  };
}

export function selectLanguage(lang: "LANG1" | "LANG2") {
  const uid = window.webxdc.selfAddr;
  window.webxdc.sendUpdate(
    {
      payload: { uid, cmd: LANG_CMD, lang },
    },
    "",
  );
}

export function importGame(rawBackup: string): boolean {
  let backup: Backup;
  try {
    backup = JSON.parse(rawBackup);
  } catch (e) {
    console.log(e);
    return false;
  }

  if (isValidBackup(backup)) {
    const uid = window.webxdc.selfAddr;
    window.webxdc.sendUpdate(
      {
        payload: { uid, cmd: IMPORT_CMD, backup },
      },
      "",
    );
    return true;
  }
  return false;
}

export function startNewGame(mode: GameMode, energyCost: number): boolean {
  const energy = getEnergy(BASE_MAX_ENERGY).energy - energyCost;
  if (energy < 0) return false;

  const uid = window.webxdc.selfAddr;
  window.webxdc.sendUpdate(
    {
      payload: { uid, cmd: NEW_CMD, time: Date.now(), energy, mode },
    },
    "",
  );
  return true;
}

export async function upgradeSkill(
  skill: keyof PlayerSkills,
): Promise<boolean> {
  const skillPoints = getSkillPoints();
  if (skillPoints < 1) return false;
  const nextSkillPoints = skillPoints - 1;
  const motivatedSkill = getMotivatedSkillLevel();
  const maxEnergySkill = getMaxEnergySkillLevel();
  const berserkerSkill = getBerserkerSkillLevel();
  const goldenTouchSkill = getGoldenTouchSkillLevel();
  const lifeStealSkill = getLifeStealSkillLevel();
  const criticalHitSkill = getCriticalHitSkillLevel();
  const fastLearnerSkill = getFastLearnerSkillLevel();
  const onFireSkill = getOnFireSkillLevel();

  const uid = window.webxdc.selfAddr;
  window.webxdc.sendUpdate(
    {
      payload: {
        uid,
        cmd: SKILL_UP_CMD,
        skill,
        skillPoints: nextSkillPoints,
        motivated: skill === "motivated" ? motivatedSkill + 1 : motivatedSkill,
        maxEnergy: skill === "maxEnergy" ? maxEnergySkill + 1 : maxEnergySkill,
        berserker: skill === "berserker" ? berserkerSkill + 1 : berserkerSkill,
        goldenTouch:
          skill === "goldenTouch" ? goldenTouchSkill + 1 : goldenTouchSkill,
        lifeSteal: skill === "lifeSteal" ? lifeStealSkill + 1 : lifeStealSkill,
        criticalHit:
          skill === "criticalHit" ? criticalHitSkill + 1 : criticalHitSkill,
        fastLearner:
          skill === "fastLearner" ? fastLearnerSkill + 1 : fastLearnerSkill,
        onFire: skill === "onFire" ? onFireSkill + 1 : onFireSkill,
      },
    },
    "",
  );
  return true;
}

function getResultsModal(
  session: Session,
  endTime: number,
  next: ModalPayload | null,
): ModalPayload {
  const total = session.correct.length;
  const correct = total - session.failedIds.length;
  return {
    type: "results",
    time: endTime - session.start,
    xp: session.xp + session.onFireXp,
    onFireXp: session.onFireXp,
    accuracy: Math.round((correct / total) * 100),
    next,
  };
}

export function sendMonsterUpdate(
  monster: Monster,
  correct: number,
): MonsterUpdateResult {
  monster = { ...monster };
  let modal = null;
  const skillEffects: SkillEffectGain[] = [];
  const now = new Date();
  const level = getLevel();
  monster.seen = now.getTime();
  let xp = 0;
  if (correct > 0) {
    monster.streak = Math.min(monster.streak + correct, MAX_MONSTER_STREAK);
    if (level !== MAX_LEVEL) {
      const bonus = Math.min(Math.floor(level / 5), 40);
      xp = Math.min(bonus + monster.streak, 50) + getFastLearnerSkillLevel();
      if (rollCriticalHit()) {
        xp = Math.round(xp * CRITICAL_HIT_XP_MULTIPLIER);
        skillEffects.push({
          source: "criticalHit",
          stat: "xp",
          amount: xp,
        });
      } else {
        skillEffects.push({
          source: "correctAnswer",
          stat: "xp",
          amount: xp,
        });
      }
    }

    const addHours = (hours: number): number =>
      new Date(now).setHours(now.getHours() + hours);
    const addDays = (days: number): number => {
      return new Date(new Date(now).setHours(0, 0, 0, 0)).setDate(
        now.getDate() + days,
      );
    };

    switch (monster.streak) {
      case 1: {
        monster.due = addHours(2);
        break;
      }
      case 2: {
        monster.due = addHours(24);
        break;
      }
      case 3: {
        monster.due = addHours(48);
        break;
      }
      default: {
        if (monster.streak > 15) {
          const mul = correct > 1 ? 10 : 4;
          monster.due = addDays(30 * 5 + monster.streak * mul);
        } else if (monster.streak > 10) {
          monster.due = addDays(30 * (monster.streak - 10));
        } else if (monster.streak > MASTERED_STREAK) {
          monster.due = addDays(monster.streak * 2);
        } else {
          monster.due = addDays(monster.streak);
        }
      }
    }
  } else {
    monster.streak = 0;
    monster.due = 0;
    monster.lastFailed = now.getTime();
    skillEffects.push({
      source: "incorrectAnswer",
      stat: "xp",
      amount: 0,
    });
  }

  const session = getSession()!;
  for (const { monster, xp, energyGained } of pendingMonsterUpdates) {
    updateMonster(monster, session);
    session.xp += xp;
    session.energyGained += energyGained;
  }
  updateMonster(monster, session);
  session.xp += xp;
  const currentEnergyGained = correct > 0 ? rollLifeSteal() : 0;
  if (currentEnergyGained > 0) {
    skillEffects.push({
      source: "lifeSteal",
      stat: "energy",
      amount: currentEnergyGained,
    });
  }
  session.energyGained += currentEnergyGained;
  if (!session.pending.length && !session.failed.length) {
    // session finished, clear pending updates queue,
    // session contains updated state
    pendingMonsterUpdates.length = 0;

    session.onFireXp = getOnFireBonusXp(session);

    const update = {
      payload: {
        uid: window.webxdc.selfAddr,
        cmd: FINISHED_CMD,
        session,
      },
    } as SendingStatusUpdate<Payload>;
    const { level: newLevel } = increaseXp(session.xp + session.onFireXp);
    if (level < newLevel) {
      const rewards = getLevelUpRewards(level, newLevel);
      modal = getResultsModal(session, monster.seen, {
        type: "levelUp",
        newLevel,
        restoredEnergy: rewards.restoredEnergy,
        skillPoints: rewards.skillPoints,
      });
      update.info = `${window.webxdc.selfName} reached level ${newLevel} 🎉`;
    } else {
      modal = getResultsModal(session, monster.seen, null);
    }
    window.webxdc.sendUpdate(update, "");
  } else {
    pendingMonsterUpdates.push({
      monster,
      sessionId: session.start,
      xp,
      energyGained: currentEnergyGained,
    });
    updateSessionState(
      session,
      skillEffects.length ? SKILL_EFFECT_ANIMATION_MS : 0,
    );
  }
  return {
    modal,
    skillEffects,
  };
}

export function initGame(
  sessionHook: (session: Session | null) => void,
  playerHook: (player: Player) => void,
  welcomeHook: (state: boolean) => void,
) {
  window.webxdc
    .setUpdateListener(
      (update: ReceivedStatusUpdate<Payload>) => queue.push(update),
      getMaxSerial(),
    )
    .then(() => {
      queue.push({
        payload: {
          uid: window.webxdc.selfAddr,
          cmd: INIT_CMD,
          sessionHook,
          welcomeHook,
          playerHook,
        },
        serial: -1,
        max_serial: 0,
      });
    });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushPendingMonsterUpdates();
    }
  });
  window.addEventListener("beforeunload", flushPendingMonsterUpdates);
}

async function processUpdate(update: ReceivedStatusUpdate<Payload>) {
  const payload = update.payload;
  if (payload.uid === window.webxdc.selfAddr) {
    switch (payload.cmd) {
      case INIT_CMD: {
        setSessionState = payload.sessionHook;
        setPlayerState = payload.playerHook;
        setWelcomeCompleteState = payload.welcomeHook;
        setWelcomeCompleteState(!!getLearningLanguage());
        updateSessionState(getSession());
        // player must be set last because it used to detect initialization
        setPlayerState(await getPlayer());

        return; // this command is not real update, abort
      }
      case MONSTER_UPDATE_CMD: {
        const session = getSession();
        let needsUpdate = false;
        for (const {
          monster,
          sessionId,
          xp,
          energyGained,
        } of payload.monsters) {
          if (session && sessionId === session.start) {
            const findMon = (m: Monster) =>
              m.id === monster.id && m.seen === monster.seen;
            // hack for iOS bug: updates get processed twice
            if (
              session.correct.findIndex(findMon) === -1 &&
              session.failed.findIndex(findMon) === -1
            ) {
              updateMonster(monster, session);
              if (xp) session.xp += xp;
              if (energyGained) session.energyGained += energyGained;
              needsUpdate = true;
            }
          }
        }
        if (needsUpdate) {
          setSession(session!);
          updateSessionState(session!);
        }
        break;
      }
      case FINISHED_CMD: {
        const session = payload.session;
        await db.monsters.bulkPut(session.correct);

        if (session.energyGained) {
          const { energy, time } = getEnergy(BASE_MAX_ENERGY);
          const maxEnergy = getMaxEnergy(getMaxEnergySkillLevel());
          const newEnergy = Math.min(energy + session.energyGained, maxEnergy);
          if (newEnergy > energy) setEnergy(newEnergy, time);
        }

        const currentLevel = getLevel();
        const { xp, level } = increaseXp(session.xp + session.onFireXp);
        if (currentLevel < level) {
          const rewards = getLevelUpRewards(currentLevel, level);
          if (rewards.restoredEnergy) setEnergy(rewards.nextEnergy, Date.now());
          setSkillPoints(getSkillPoints() + rewards.skillPoints);
        }
        setXp(xp);
        setLevel(level);

        const date = new Date(session.correct[session.correct.length - 1].seen);
        const newPlayed = date.setHours(0, 0, 0, 0);
        const lastPlayed = getLastPlayed();
        if (lastPlayed < newPlayed) {
          setStudiedToday(session.correct.length); // different day, reset counter
          setLastPlayed(newPlayed);
          const oneDayBefore = date.setDate(date.getDate() - 1);
          setStreak(lastPlayed < oneDayBefore ? 1 : getStreak() + 1);
        } else {
          // same day, increase counter
          setStudiedToday(getStudiedToday() + session.correct.length);
        }
        if (setPlayerState) setPlayerState(await getPlayer());
        setSession(session);
        updateSessionState(session);
        break;
      }
      case NEW_CMD: {
        setEnergy(payload.energy, payload.time);
        const session = await createNewSession(payload.time, payload.mode);
        setSession(session);
        updateSessionState(session);
        break;
      }
      case SKILL_UP_CMD: {
        setSkillPoints(payload.skillPoints);
        setMotivatedSkillLevel(payload.motivated);
        setMaxEnergySkillLevel(payload.maxEnergy);
        setBerserkerSkillLevel(payload.berserker);
        setGoldenTouchSkillLevel(payload.goldenTouch);
        setLifeStealSkillLevel(payload.lifeSteal);
        setCriticalHitSkillLevel(payload.criticalHit);
        setFastLearnerSkillLevel(payload.fastLearner);
        setOnFireSkillLevel(payload.onFire);
        if (setPlayerState) setPlayerState(await getPlayer());
        break;
      }
      case LANG_CMD: {
        setLearningLanguage(payload.lang);
        initializeSentences(payload.lang);
        setWelcomeCompleteState(true);
        break;
      }
      case IMPORT_CMD: {
        await importBackup(payload.backup);
        initializeSentences(getLearningLanguage());
        setWelcomeCompleteState(true);
        if (setPlayerState) setPlayerState(await getPlayer());
        updateSessionState(getSession());
        break;
      }
    }
  }

  if (update.serial === update.max_serial) setMaxSerial(update.serial);
}

async function createNewSession(
  start: number,
  mode: GameMode,
): Promise<Session> {
  let monsters = await db.monsters
    .orderBy("due")
    .filter((monster) => monster.due <= start)
    .limit(10)
    .toArray();
  let unseenIndex = getUnseenIndex();
  const newMonsters = [];
  for (
    let i = unseenIndex;
    newMonsters.length + monsters.length < 10 && i < SENTENCES.length;
    i++
  ) {
    newMonsters.push({ id: i, streak: 0, due: 0, seen: 0 });
  }
  if (newMonsters.length > 0) {
    await db.monsters.bulkPut(newMonsters);
    setUnseenIndex(unseenIndex + newMonsters.length);
  }
  if (monsters.length < 10) {
    monsters = await db.monsters.orderBy("due").limit(10).toArray();
  }

  monsters.sort((mon1, mon2) => {
    if (mon1.seen === 0 || mon2.seen === 0) {
      return mon2.seen - mon1.seen;
    }
    return 0;
  });

  return {
    start,
    mode,
    xp: 0,
    onFireXp: 0,
    energyGained: 0,
    failedIds: [],
    correct: [],
    failed: [],
    pending: monsters,
  };
}

function updateMonster(monster: Monster, session: Session) {
  let array = session.pending;
  let index = array.findIndex((c) => c.id === monster.id);
  if (index === -1) {
    array = session.failed;
    index = array.findIndex((c) => c.id === monster.id);
  }
  array.splice(index, 1);
  if (monster.streak === 0) {
    session.failed.push(monster);
    if (session.failedIds.indexOf(monster.id) === -1) {
      session.failedIds.push(monster.id);
    }
  } else {
    session.correct.push(monster);
  }
}

function increaseXp(xp: number): { xp: number; level: number } {
  xp += getXp();
  let level = getLevel();
  let totalXp = toNextLevelMediumFast(level);
  while (xp >= totalXp) {
    xp -= totalXp;
    totalXp = toNextLevelMediumFast(++level);
  }
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = 0;
  }
  return { level, xp };
}

function getLevelUpRewards(currentLevel: number, newLevel: number) {
  const lvlCount = newLevel - currentLevel;
  const { energy } = getEnergy(BASE_MAX_ENERGY);
  const maxEnergy = getMaxEnergy(getMaxEnergySkillLevel());
  const missingEnergy = Math.max(0, maxEnergy - energy);
  const restoredPercent = getMotivatedRestorePercent(getMotivatedSkillLevel());
  const restoredEnergy = Math.min(
    lvlCount * Math.floor((maxEnergy * restoredPercent) / 100),
    missingEnergy,
  );
  return {
    skillPoints: lvlCount,
    restoredEnergy,
    nextEnergy: energy + restoredEnergy,
  };
}

export function getMotivatedRestorePercent(level: number): number {
  return (
    level &&
    MOTIVATED_BASE_RESTORE_PERCENT + level * MOTIVATED_SKILL_PER_LEVEL_PERCENT
  );
}

function getBerserkerReductionPerPoint(toReview: number): number {
  if (toReview >= 500) return 2;
  if (toReview >= 400) return 1.6;
  if (toReview >= 300) return 1.2;
  if (toReview >= 200) return 0.8;
  if (toReview >= 100) return 0.4;
  return 0;
}

export function getBerserkerReductionPercent(
  mode: GameMode,
  toReview: number,
  berserkerLevel: number,
): number {
  if (!berserkerLevel) return 0;

  const reductionPerPoint = getBerserkerReductionPerPoint(toReview);
  const modeMultiplier = mode === "easy" ? 0.5 : 1;
  return (
    Math.round(berserkerLevel * reductionPerPoint * modeMultiplier * 10) / 10
  );
}

export function getPlayEnergyCost(
  mode: GameMode,
  toReview: number,
  berserkerLevel: number,
): number {
  const totalReductionPercent = getBerserkerReductionPercent(
    mode,
    toReview,
    berserkerLevel,
  );
  return Math.ceil(PLAY_ENERGY_COST * (1 - totalReductionPercent / 100));
}

function toNextLevelMediumFast(level: number): number {
  if (level === 1) return 20;
  if (level === 2) return 34;
  if (level === 3) return 47;
  return (level + 1) ** 3 - level ** 3;
}

function getMaxEnergy(level: number): number {
  return BASE_MAX_ENERGY + level * 10;
}

export function getLifeStealChance(level: number): number {
  return level
    ? LIFE_STEAL_BASE_CHANCE + level * LIFE_STEAL_CHANCE_PER_LEVEL
    : 0;
}

function rollLifeSteal(): number {
  const lifeStealLevel = getLifeStealSkillLevel();
  if (!lifeStealLevel) return 0;
  const chance = getLifeStealChance(lifeStealLevel);
  return Math.random() * 100 < chance ? 5 : 0;
}

export function getCriticalHitChance(level: number): number {
  return level
    ? CRITICAL_HIT_BASE_CHANCE + level * CRITICAL_HIT_CHANCE_PER_LEVEL
    : 0;
}

function rollCriticalHit(): boolean {
  const criticalHitLevel = getCriticalHitSkillLevel();
  if (!criticalHitLevel) return false;
  const chance = getCriticalHitChance(criticalHitLevel);
  return Math.random() * 100 < chance;
}

function getOnFireBonusXp(session: Session): number {
  const onFireLevel = getOnFireSkillLevel();
  if (!onFireLevel || !session.correct.length) return 0;

  const seen = session.correct[session.correct.length - 1].seen;
  const newPlayed = new Date(seen).setHours(0, 0, 0, 0);
  const lastPlayed = getLastPlayed();
  if (lastPlayed >= newPlayed) return 0;

  const oneDayBefore = new Date(newPlayed);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  const nextStreak = lastPlayed < oneDayBefore.getTime() ? 1 : getStreak() + 1;
  if (nextStreak < ON_FIRE_STREAK_THRESHOLD) return 0;

  return onFireLevel * ON_FIRE_BASE_XP_PER_UPGRADE;
}
