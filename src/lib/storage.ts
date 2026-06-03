import Dexie, { type EntityTable } from "dexie";

import { LANG1_CODE, LANG2_CODE } from "~/lib/constants";
import { SENTENCES } from "~/lib/sentences";

const VERSION = 5;

export const db = new Dexie("gamedb") as Dexie & {
  monsters: EntityTable<Monster, "id">;
};
db.version(1).stores({ monsters: "id, streak, due" });

const BACKUP_CODE = `${LANG1_CODE}-${LANG2_CODE}`;

export async function exportBackup(): Promise<Backup> {
  const monsters = await db.monsters.toArray();
  return {
    version: VERSION,
    lang: BACKUP_CODE,
    monsters,
    session: localStorage.session,
    unseenIndex: localStorage.unseenIndex,
    // Player
    streak: localStorage.streak,
    level: localStorage.level,
    xp: localStorage.xp,
    energy: localStorage.energy,
    energyTimestamp: localStorage.energyTimestamp,
    studiedToday: localStorage.studiedToday,
    lastPlayed: localStorage.lastPlayed,
    skillPoints: localStorage.skillPoints,
    motivatedSkill: localStorage.motivatedSkill,
    maxEnergySkill: localStorage.maxEnergySkill,
    berserkerSkill: localStorage.berserkerSkill,
    goldenTouchSkill: localStorage.goldenTouchSkill,
    lifeStealSkill: localStorage.lifeStealSkill,
    criticalHitSkill: localStorage.criticalHitSkill,
    fastLearnerSkill: localStorage.fastLearnerSkill,
    onFireSkill: localStorage.onFireSkill,
    // UI settings
    sfx: localStorage.sfx,
    tts: localStorage.tts,
    pixelFont: localStorage.pixelFont,
    learningLanguage: localStorage.learningLanguage,
  };
}

export async function importBackup(backup: Backup) {
  if (!isValidBackup(backup)) {
    return;
  }

  if (backup.version < 5) {
    backup.energy = (parseInt(backup.energy) * 10).toString();
    if (backup.session) {
      const session = JSON.parse(backup.session);
      session.energyGained = 0;
      session.onFireXp = 0;
      backup.session = JSON.stringify(session);
    }
  }

  await db.monsters.bulkPut(
    backup.monsters.filter((mon) => mon.id < SENTENCES.length),
  );
  localStorage.session = backup.session || "";
  localStorage.unseenIndex = backup.unseenIndex;
  // Player
  localStorage.streak = backup.streak;
  localStorage.level = backup.level;
  localStorage.xp = backup.xp;
  localStorage.energy = backup.energy;
  localStorage.energyTimestamp = backup.energyTimestamp;
  localStorage.studiedToday = backup.studiedToday;
  localStorage.lastPlayed = backup.lastPlayed;
  localStorage.skillPoints = backup.skillPoints || backup.level;
  localStorage.motivatedSkill = backup.motivatedSkill || "0";
  localStorage.maxEnergySkill = backup.maxEnergySkill || "0";
  localStorage.berserkerSkill = backup.berserkerSkill || "0";
  localStorage.goldenTouchSkill = backup.goldenTouchSkill || "0";
  localStorage.lifeStealSkill = backup.lifeStealSkill || "0";
  localStorage.criticalHitSkill = backup.criticalHitSkill || "0";
  localStorage.fastLearnerSkill = backup.fastLearnerSkill || "0";
  localStorage.onFireSkill = backup.onFireSkill || "0";
  // UI settings
  localStorage.sfx = backup.sfx || "";
  localStorage.tts = backup.tts || "";
  localStorage.pixelFont = backup.pixelFont || "1";
  localStorage.learningLanguage = backup.learningLanguage || "LANG1";
}

export function isValidBackup(backup: Backup): boolean {
  return (
    backup.lang === BACKUP_CODE &&
    backup.version <= VERSION &&
    backup.version > 2
  );
}

export function getSession(): Session | null {
  const session = localStorage.session;
  return session ? JSON.parse(session) : null;
}

export function setSession(session: Session) {
  localStorage.session = JSON.stringify(session);
}

export function getMaxSerial(): number {
  return parseInt(localStorage.maxSerial || "0");
}

export function setMaxSerial(maxSerial: number) {
  localStorage.maxSerial = maxSerial;
}

export function getSFXEnabled(): boolean {
  return parseInt(localStorage.sfx || "1") === 1;
}

export function setSFXEnabled(enabled: boolean) {
  localStorage.sfx = enabled ? 1 : 0;
}

export function getTTSEnabled(): boolean {
  return parseInt(localStorage.tts || "1") === 1;
}

export function setTTSEnabled(enabled: boolean) {
  localStorage.tts = enabled ? 1 : 0;
}

export function getPixelFontEnabled(): boolean {
  return parseInt(localStorage.pixelFont || "1") === 1;
}

export function setPixelFontEnabled(enabled: boolean) {
  localStorage.pixelFont = enabled ? 1 : 0;
}

export function getLearningLanguage(): string {
  return localStorage.learningLanguage || "";
}

export function setLearningLanguage(lang: string) {
  localStorage.learningLanguage = lang;
}

export function getUnseenIndex(): number {
  return parseInt(localStorage.unseenIndex || "0");
}

export function setUnseenIndex(unseenIndex: number) {
  localStorage.unseenIndex = unseenIndex;
}

export function getStreak(): number {
  return parseInt(localStorage.streak || "0");
}

export function setStreak(streak: number) {
  localStorage.streak = streak;
}

export function getLevel(): number {
  return parseInt(localStorage.level || "1");
}

export function setLevel(level: number) {
  localStorage.level = level;
}

export function getXp(): number {
  return parseInt(localStorage.xp || "0");
}

export function setXp(xp: number) {
  localStorage.xp = xp;
}

export function getEnergy(defEnergy: number): { energy: number; time: number } {
  return {
    energy: parseInt(localStorage.energy || defEnergy),
    time: parseInt(localStorage.energyTimestamp || "0"),
  };
}

export function setEnergy(energy: number, time: number) {
  localStorage.energy = energy;
  localStorage.energyTimestamp = time;
}

export function getSkillPoints(): number {
  return parseInt(localStorage.skillPoints || "1");
}

export function setSkillPoints(skillPoints: number) {
  localStorage.skillPoints = skillPoints.toString();
}

export function getMotivatedSkillLevel(): number {
  return parseInt(localStorage.motivatedSkill || "0");
}

export function setMotivatedSkillLevel(level: number) {
  localStorage.motivatedSkill = level.toString();
}

export function getMaxEnergySkillLevel(): number {
  return parseInt(localStorage.maxEnergySkill || "0");
}

export function setMaxEnergySkillLevel(level: number) {
  localStorage.maxEnergySkill = level.toString();
}

export function getBerserkerSkillLevel(): number {
  return parseInt(localStorage.berserkerSkill || "0");
}

export function setBerserkerSkillLevel(level: number) {
  localStorage.berserkerSkill = level.toString();
}

export function getGoldenTouchSkillLevel(): number {
  return parseInt(localStorage.goldenTouchSkill || "0");
}

export function setGoldenTouchSkillLevel(level: number) {
  localStorage.goldenTouchSkill = level.toString();
}

export function getLifeStealSkillLevel(): number {
  return parseInt(localStorage.lifeStealSkill || "0");
}

export function setLifeStealSkillLevel(level: number) {
  localStorage.lifeStealSkill = level.toString();
}

export function getCriticalHitSkillLevel(): number {
  return parseInt(localStorage.criticalHitSkill || "0");
}

export function setCriticalHitSkillLevel(level: number) {
  localStorage.criticalHitSkill = level.toString();
}

export function getFastLearnerSkillLevel(): number {
  return parseInt(localStorage.fastLearnerSkill || "0");
}

export function setFastLearnerSkillLevel(level: number) {
  localStorage.fastLearnerSkill = level.toString();
}

export function getOnFireSkillLevel(): number {
  return parseInt(localStorage.onFireSkill || "0");
}

export function setOnFireSkillLevel(level: number) {
  localStorage.onFireSkill = level.toString();
}

export function getStudiedToday(): number {
  return parseInt(localStorage.studiedToday || "0");
}

export function setStudiedToday(count: number) {
  localStorage.studiedToday = count;
}

export function getLastPlayed(): number {
  return parseInt(localStorage.lastPlayed || "0");
}

export function setLastPlayed(day: number) {
  localStorage.lastPlayed = day;
}

// @ts-ignore: for testing
window.reset = () => {
  db.delete();
  localStorage.clear();
  window.location.reload();
};
