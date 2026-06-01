import { useCallback, useState } from "react";

import { _ } from "~/lib/i18n";
import {
  upgradeSkill,
  getMotivatedRestorePercent,
  MOTIVATED_BASE_RESTORE_PERCENT,
  MOTIVATED_SKILL_PER_LEVEL_PERCENT,
  MOTIVATED_SKILL_MAX_LEVEL,
  MAX_ENERGY_SKILL_MAX_LEVEL,
  BERSERKER_SKILL_MAX_LEVEL,
  getBerserkerReductionPercent,
  GOLDEN_TOUCH_SKILL_MAX_LEVEL,
  LIFE_STEAL_SKILL_MAX_LEVEL,
  LIFE_STEAL_BASE_CHANCE,
  LIFE_STEAL_CHANCE_PER_LEVEL,
  getLifeStealChance,
  CRITICAL_HIT_SKILL_MAX_LEVEL,
  CRITICAL_HIT_BASE_CHANCE,
  CRITICAL_HIT_CHANCE_PER_LEVEL,
  getCriticalHitChance,
  FAST_LEARNER_SKILL_MAX_LEVEL,
  ON_FIRE_SKILL_MAX_LEVEL,
  ON_FIRE_BASE_XP_PER_UPGRADE,
  ON_FIRE_STREAK_THRESHOLD,
} from "~/lib/game";
import {
  MAIN_COLOR,
  GOLDEN,
  BG_SECONDARY,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  BLUE,
} from "~/lib/theme";

import MenuButton from "~/components/MenuButton";

const card = {
  display: "flex",
  flexDirection: "column" as "column",
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: "10px",
  padding: "1em",
  marginBottom: "1em",
};

interface Props {
  player: Player;
  onBack: () => void;
}

export default function Skills({ player, onBack }: Props) {
  const currBerserkerEasy = getBerserkerReductionPercent(
    "easy",
    player.toReview,
    player.skills.berserker,
  );
  const currBerserkerNormal = getBerserkerReductionPercent(
    "normal",
    player.toReview,
    player.skills.berserker,
  );

  return (
    <div style={{ padding: "0.5em" }}>
      <div style={{ ...card, border: undefined }}>
        <div style={{ fontSize: "1.2em" }}>
          {_("SKILLS")}
          <hr />
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_("Spend skill points to upgrade your passive abilities.")}
        </div>
        <div
          style={{
            marginTop: "1em",
            color: player.skillPoints > 0 ? MAIN_COLOR : TEXT_TERTIARY,
          }}
        >
          {_("Skill Points: {{x}}").replace(
            "{{x}}",
            String(player.skillPoints),
          )}
        </div>
      </div>

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"motivated"}
        skillIcon={"/blessed.png"}
        skillIconColor={"#5B2E8A"}
        skillName={_("Blessed")}
        skillLevel={player.skills.motivated}
        skillMaxLevel={MOTIVATED_SKILL_MAX_LEVEL}
        skillDescription={_(
          "When you level up, a surge of divine energy flows through your body instantly restoring {{base}}% of your maximum energy, plus an additional +{{inc}}% per upgrade.",
        )
          .replace("{{base}}", String(MOTIVATED_BASE_RESTORE_PERCENT))
          .replace("{{inc}}", String(MOTIVATED_SKILL_PER_LEVEL_PERCENT))}
        skillSummary={_("{{x}}% of maximum energy restored").replace(
          "{{x}}",
          String(getMotivatedRestorePercent(player.skills.motivated)),
        )}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"fastLearner"}
        skillIcon={"/fast-learner.png"}
        skillIconColor={BLUE}
        skillName={_("Fast Learner")}
        skillLevel={player.skills.fastLearner}
        skillMaxLevel={FAST_LEARNER_SKILL_MAX_LEVEL}
        skillDescription={_(
          "You learn faster than the average person, earning more experience than usual per correctly answered sentence (+1 XP per upgrade).",
        )}
        skillSummary={_("+{{x}} XP per correct answer").replace(
          "{{x}}",
          String(player.skills.fastLearner),
        )}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"maxEnergy"}
        skillIcon={"/stamina.png"}
        skillIconColor={"#C62828"}
        skillName={_("Stamina")}
        skillLevel={player.skills.maxEnergy}
        skillMaxLevel={MAX_ENERGY_SKILL_MAX_LEVEL}
        skillDescription={_(
          "Increases your maximum energy by +10 per upgrade.",
        )}
        skillSummary={_("+{{x}} maximum energy").replace(
          "{{x}}",
          `${player.skills.maxEnergy * 10}`,
        )}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"berserker"}
        skillIcon={"/berserker.png"}
        skillIconColor={"#FF6D00"}
        skillName={_("Berserker")}
        skillLevel={player.skills.berserker}
        skillMaxLevel={BERSERKER_SKILL_MAX_LEVEL}
        skillDescription={_(
          "Having so much pending sentences to review starts to put your mind into overdrive. The heavier the workload, the less energy each review session consumes. Reduces energy cost based on pending reviews: 100+ (-0.4%), 200+ (-0.8%), 300+ (-1.2%), 400+ (-1.6%), 500+ (-2%) per upgrade.",
        )}
        skillSummary={_(
          "-{{easy}}% easy / -{{normal}}% normal with {{x}} to review",
        )
          .replace("{{easy}}", String(currBerserkerEasy))
          .replace("{{normal}}", String(currBerserkerNormal))
          .replace("{{x}}", String(player.toReview))}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"lifeSteal"}
        skillIcon={"/life-steal.png"}
        skillIconColor={"#37B24D"}
        skillName={_("Life Steal")}
        skillLevel={player.skills.lifeSteal}
        skillMaxLevel={LIFE_STEAL_SKILL_MAX_LEVEL}
        skillDescription={_(
          "Each correct answer has a {{base}}% chance of restoring +5 energy, plus an additional +{{inc}}% chance per upgrade.",
        )
          .replace("{{base}}", String(LIFE_STEAL_BASE_CHANCE))
          .replace("{{inc}}", String(LIFE_STEAL_CHANCE_PER_LEVEL))}
        skillSummary={_("{{x}}% chance of +5 energy on correct answer").replace(
          "{{x}}",
          String(getLifeStealChance(player.skills.lifeSteal)),
        )}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"onFire"}
        skillIcon={"/on-fire.png"}
        skillIconColor={"#FF6D00"}
        skillName={_("On Fire")}
        skillLevel={player.skills.onFire}
        skillMaxLevel={ON_FIRE_SKILL_MAX_LEVEL}
        skillDescription={_(
          "Each day your streak increases and reaches {{min}} or higher, you gain +{{x}} XP per upgrade.",
        )
          .replace("{{min}}", String(ON_FIRE_STREAK_THRESHOLD))
          .replace("{{x}}", String(ON_FIRE_BASE_XP_PER_UPGRADE))}
        skillSummary={_("+{{x}} XP when streak increases to {{min}}+")
          .replace(
            "{{x}}",
            String(player.skills.onFire * ON_FIRE_BASE_XP_PER_UPGRADE),
          )
          .replace("{{min}}", String(ON_FIRE_STREAK_THRESHOLD))}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"goldenTouch"}
        skillIcon={"/golden-touch.png"}
        skillIconColor={GOLDEN}
        skillName={_("Golden Touch")}
        skillLevel={player.skills.goldenTouch}
        skillMaxLevel={GOLDEN_TOUCH_SKILL_MAX_LEVEL}
        skillDescription={_(
          "Pressing the golden button increases the monster's level more than usual, +1 level per upgrade.",
        )}
        skillSummary={_(
          "Monster's level increased by +{{x}} when the golden button is used",
        ).replace("{{x}}", String(5 + player.skills.goldenTouch))}
      />

      <SkillCard
        availablePoints={player.skillPoints}
        skillId={"criticalHit"}
        skillIcon={"/critical-hit.png"}
        skillIconColor={"#E53935"}
        skillName={_("Critical Hit")}
        skillLevel={player.skills.criticalHit}
        skillMaxLevel={CRITICAL_HIT_SKILL_MAX_LEVEL}
        skillDescription={_(
          "Each correct answer has a {{base}}% chance to grant x1.5 XP, plus an additional +{{inc}}% chance per upgrade.",
        )
          .replace("{{base}}", String(CRITICAL_HIT_BASE_CHANCE))
          .replace("{{inc}}", String(CRITICAL_HIT_CHANCE_PER_LEVEL))}
        skillSummary={_("{{x}}% chance of x1.5 XP on correct answer").replace(
          "{{x}}",
          String(getCriticalHitChance(player.skills.criticalHit)),
        )}
      />

      <MenuButton
        onClick={onBack}
        style={{
          color: TEXT_PRIMARY,
          backgroundColor: BG_SECONDARY,
          fontSize: "1.1em",
          marginTop: "1em",
          padding: "0.6em",
        }}
      >
        {_("Back")}
      </MenuButton>
    </div>
  );
}

interface SkillCardProps {
  availablePoints: number;
  skillId: keyof PlayerSkills;
  skillName: string;
  skillLevel: number;
  skillMaxLevel: number;
  skillDescription: string;
  skillSummary: string;
  skillIcon: string;
  skillIconColor: string;
}

function SkillCard({
  availablePoints,
  skillId,
  skillName,
  skillLevel,
  skillMaxLevel,
  skillDescription,
  skillSummary,
  skillIcon,
  skillIconColor,
}: SkillCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const onUpgradeSkill = useCallback(async () => {
    await upgradeSkill(skillId);
  }, [skillId]);

  const canUpgrade = availablePoints > 0 && skillLevel < skillMaxLevel;

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1em",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "0.75em", alignItems: "center" }}>
          <img
            src={skillIcon}
            aria-hidden
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: "3.2em",
              height: "3.2em",
              borderRadius: "8px",
              background: skillIconColor,
              padding: "0.2em",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "1em",
              lineHeight: 1.3,
              flexDirection: "column",
            }}
          >
            <div>{skillName}</div>
            <div
              style={{
                color: TEXT_TERTIARY,
                paddingTop: "0.4em",
              }}
            >
              {skillLevel}/{skillMaxLevel}
            </div>
          </div>
        </div>
        <div>
          <MenuButton
            disabled={!canUpgrade}
            onClick={onUpgradeSkill}
            aria-label={canUpgrade ? _("Upgrade") : _("MAXED")}
            style={{
              color: canUpgrade ? "black" : TEXT_PRIMARY,
              background: canUpgrade ? MAIN_COLOR : BG_SECONDARY,
              opacity: canUpgrade ? 1 : 0.7,
              minWidth: "3em",
              padding: "0.8em",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={"/upgrade.png"}
              alt=""
              aria-hidden
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              style={{ width: "2em", height: "2em" }}
            />
          </MenuButton>
        </div>
      </div>
      <div style={{ marginTop: "0.75em" }}>
        {skillLevel > 0 && skillSummary}
      </div>
      <div style={{ display: "flex", gap: "0.6em", marginTop: "1em" }}>
        <MenuButton
          onClick={() => setShowDetails((v) => !v)}
          style={{
            backgroundColor: BG_SECONDARY,
            color: TEXT_PRIMARY,
            flexGrow: 1,
          }}
        >
          {showDetails ? _("Hide Info") : _("More Info")}
        </MenuButton>
      </div>
      {showDetails && (
        <div
          style={{ marginTop: "1em", lineHeight: 1.6, color: TEXT_TERTIARY }}
        >
          {skillDescription}
        </div>
      )}
    </div>
  );
}
