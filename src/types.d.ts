declare type Payload = { uid: string } & (
  | {
      cmd: "init";
      sessionHook: (session: Session | null) => void;
      playerHook: (player: Player) => void;
      welcomeHook: (state: boolean) => void;
    }
  | {
      cmd: "mon-up";
      monsters: {
        monster: Monster;
        sessionId: number;
        xp: number;
        energyGained: number;
      }[];
    }
  | {
      cmd: "finished";
      session: Session;
    }
  | {
      cmd: "new";
      energy: number;
      time: number;
      mode: GameMode;
    }
  | {
      cmd: "import";
      backup: Backup;
    }
  | {
      cmd: "lang";
      lang: "LANG1" | "LANG2";
    }
  | {
      cmd: "skill-up";
      skill: keyof PlayerSkills;
      skillPoints: number;
      motivated: number;
      maxEnergy: number;
      berserker: number;
      goldenTouch: number;
      lifeSteal: number;
      criticalHit: number;
      fastLearner: number;
      onFire: number;
    }
);

declare interface Monster {
  id: number;
  streak: number;
  due: number; // Timestamp
  seen: number; // Timestamp
}

declare interface Card {
  id: number;
  sentence: string;
  meanings: string[];
}

declare interface Session {
  start: number;
  mode: GameMode;
  xp: number;
  onFireXp: number;
  energyGained: number;
  failedIds: number[];
  correct: Monster[];
  failed: Monster[];
  pending: Monster[];
}

declare interface Player {
  lvl: number;
  xp: number;
  totalXp: number;
  energy: number;
  maxEnergy: number;
  skillPoints: number;
  skills: PlayerSkills;
  streak: number;
  studiedToday: number; // number of sentences studied today
  toReview: number;
  seen: number; // number of sentences seen
  mastered: number; // number of sentences mastered
  total: number; // total number of sentences
}

declare interface PlayerSkills {
  motivated: number;
  maxEnergy: number;
  berserker: number;
  goldenTouch: number;
  lifeSteal: number;
  criticalHit: number;
  fastLearner: number;
  onFire: number;
}

declare interface SkillEffectGain {
  source: "criticalHit" | "correctAnswer" | "incorrectAnswer" | "lifeSteal";
  stat: "xp" | "energy";
  amount: number;
}

declare interface MonsterUpdateResult {
  modal: ModalPayload | null;
  skillEffects: SkillEffectGain[];
}

declare interface Backup {
  version: number;
  lang: string;
  monsters: Monster[];
  session: string;
  unseenIndex: string;
  streak: string;
  level: string;
  xp: string;
  energy: string;
  energyTimestamp: string;
  studiedToday: string;
  lastPlayed: string;
  skillPoints: string;
  motivatedSkill: string;
  maxEnergySkill: string;
  berserkerSkill: string;
  goldenTouchSkill: string;
  lifeStealSkill: string;
  criticalHitSkill: string;
  fastLearnerSkill: string;
  onFireSkill: string;
  sfx: string;
  tts: string;
  learningLanguage: string;
}

declare type GameMode = "easy" | "normal";

declare type ModalPayload =
  | {
      type: "levelUp";
      newLevel: number;
      restoredEnergy: number;
      skillPoints: number;
    }
  | {
      type: "results";
      time: number;
      xp: number;
      onFireXp: number;
      accuracy: number;
      next: ModalPayload | null;
    };

/** Injected by Vite: `git describe --tags`. */
declare const __APP_VERSION__: string;
