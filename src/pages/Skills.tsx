import { useCallback } from "react";

import { _ } from "~/lib/i18n";
import {
  upgradeSkill,
  getMotivatedRestorePercent,
  MOTIVATED_BASE_RESTORE_PERCENT,
  MOTIVATED_SKILL_PER_LEVEL_PERCENT,
  MOTIVATED_SKILL_MAX_LEVEL,
  MAX_ENERGY_SKILL_MAX_LEVEL,
  BERSERKER_SKILL_MAX_LEVEL,
  GOLDEN_TOUCH_SKILL_MAX_LEVEL,
  LIFE_STEAL_SKILL_MAX_LEVEL,
  LIFE_STEAL_BASE_CHANCE,
  LIFE_STEAL_CHANCE_PER_LEVEL,
  getLifeStealChance,
  getBerserkerReductionPercent,
} from "~/lib/game";
import {
  MAIN_COLOR,
  BG_SECONDARY,
  BG_TERTIARY,
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
  borderRadius: "5px",
  padding: "1em",
  marginBottom: "1em",
};

interface Props {
  player: Player;
  onBack: () => void;
}

export default function Skills({ player, onBack }: Props) {
  const motivatedLevel = player.skills.motivated;
  const motivatedPercent = getMotivatedRestorePercent(motivatedLevel);
  const maxEnergyLevel = player.skills.maxEnergy;
  const berserkerLevel = player.skills.berserker;
  const goldenTouchLevel = player.skills.goldenTouch;
  const lifeStealLevel = player.skills.lifeSteal;
  const canUpgradeMotivated =
    player.skillPoints > 0 && motivatedLevel < MOTIVATED_SKILL_MAX_LEVEL;
  const canUpgradeMaxEnergy =
    player.skillPoints > 0 && maxEnergyLevel < MAX_ENERGY_SKILL_MAX_LEVEL;
  const canUpgradeBerserker =
    player.skillPoints > 0 && berserkerLevel < BERSERKER_SKILL_MAX_LEVEL;
  const canUpgradeGoldenTouch =
    player.skillPoints > 0 && goldenTouchLevel < GOLDEN_TOUCH_SKILL_MAX_LEVEL;
  const canUpgradeLifeSteal =
    player.skillPoints > 0 && lifeStealLevel < LIFE_STEAL_SKILL_MAX_LEVEL;

  const onUpgradeMotivated = useCallback(async () => {
    await upgradeSkill("motivated");
  }, []);
  const onUpgradeMaxEnergy = useCallback(async () => {
    await upgradeSkill("maxEnergy");
  }, []);
  const onUpgradeBerserker = useCallback(async () => {
    await upgradeSkill("berserker");
  }, []);
  const onUpgradeGoldenTouch = useCallback(async () => {
    await upgradeSkill("goldenTouch");
  }, []);
  const onUpgradeLifeSteal = useCallback(async () => {
    await upgradeSkill("lifeSteal");
  }, []);

  const currMotivated = _("{{x}}% of max. energy restored").replace(
    "{{x}}",
    String(motivatedPercent),
  );
  const currMaxEnergy = _("+{{x}} max. energy").replace(
    "{{x}}",
    `${maxEnergyLevel}`,
  );

  const currBerserkerEasy = getBerserkerReductionPercent(
    "easy",
    player.toReview,
    berserkerLevel,
  );
  const currBerserkerNormal = getBerserkerReductionPercent(
    "normal",
    player.toReview,
    berserkerLevel,
  );
  const currBerserker = _(
    "-{{easy}}% easy / -{{normal}}% normal with {{x}} to review",
  )
    .replace("{{easy}}", String(currBerserkerEasy))
    .replace("{{normal}}", String(currBerserkerNormal))
    .replace("{{x}}", String(player.toReview));

  const currGoldenTouch = _(
    "Monster's level increased by +{{x}} when the golden button is used",
  ).replace("{{x}}", String(5 + goldenTouchLevel));

  const currLifeSteal = _(
    "{{x}}% chance of +1 energy on correct answer",
  ).replace("{{x}}", String(getLifeStealChance(lifeStealLevel)));

  return (
    <div style={{ padding: "0.5em" }}>
      <div style={card}>
        <div style={{ fontSize: "1.2em", color: MAIN_COLOR }}>
          {_("SKILLS")}
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_("Spend skill points to upgrade your passive abilities.")}
        </div>
        <div style={{ marginTop: "1em", color: BLUE }}>
          {_("Skill Points: {{x}}").replace(
            "{{x}}",
            String(player.skillPoints),
          )}
        </div>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1em",
            alignItems: "center",
          }}
        >
          <div style={{ color: MAIN_COLOR, fontSize: "1.1em" }}>
            {_("Blessed")}
          </div>
          <div>
            {_("LEVEL")} {motivatedLevel}/{MOTIVATED_SKILL_MAX_LEVEL}
          </div>
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_(
            "When you level up, a surge of divine energy flows through your body instantly restoring {{base}}% of your maximum energy, plus an additional +{{inc}}% per upgrade.",
          )
            .replace("{{base}}", String(MOTIVATED_BASE_RESTORE_PERCENT))
            .replace("{{inc}}", String(MOTIVATED_SKILL_PER_LEVEL_PERCENT))}
        </div>
        <div style={{ marginTop: "1em", color: TEXT_TERTIARY }}>
          {_("Current Level: {{x}}").replace("{{x}}", currMotivated)}
        </div>
        <MenuButton
          disabled={!canUpgradeMotivated}
          onClick={onUpgradeMotivated}
          style={{
            marginTop: "1.5em",
            color: canUpgradeMotivated ? "black" : TEXT_PRIMARY,
            background: canUpgradeMotivated ? MAIN_COLOR : BG_TERTIARY,
            opacity: canUpgradeMotivated ? 1 : 0.7,
          }}
        >
          {motivatedLevel >= MOTIVATED_SKILL_MAX_LEVEL
            ? _("MAXED")
            : _("Upgrade")}
        </MenuButton>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1em",
            alignItems: "center",
          }}
        >
          <div style={{ color: MAIN_COLOR, fontSize: "1.1em" }}>
            {_("Stamina")}
          </div>
          <div>
            {_("LEVEL")} {maxEnergyLevel}/{MAX_ENERGY_SKILL_MAX_LEVEL}
          </div>
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_("Increases your maximum energy by +1 per upgrade.")}
        </div>
        <div style={{ marginTop: "1em", color: TEXT_TERTIARY }}>
          {_("Current Level: {{x}}").replace("{{x}}", currMaxEnergy)}
        </div>
        <MenuButton
          disabled={!canUpgradeMaxEnergy}
          onClick={onUpgradeMaxEnergy}
          style={{
            marginTop: "1.5em",
            color: canUpgradeMaxEnergy ? "black" : TEXT_PRIMARY,
            background: canUpgradeMaxEnergy ? MAIN_COLOR : BG_TERTIARY,
            opacity: canUpgradeMaxEnergy ? 1 : 0.7,
          }}
        >
          {maxEnergyLevel >= MAX_ENERGY_SKILL_MAX_LEVEL
            ? _("MAXED")
            : _("Upgrade")}
        </MenuButton>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1em",
            alignItems: "center",
          }}
        >
          <div style={{ color: MAIN_COLOR, fontSize: "1.1em" }}>
            {_("Berserker")}
          </div>
          <div>
            {_("LEVEL")} {berserkerLevel}/{BERSERKER_SKILL_MAX_LEVEL}
          </div>
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_(
            "Having so much pending sentences to review starts to put your mind into overdrive. The heavier the workload, the less energy each review session consumes. Reduces energy cost based on pending reviews: 100+ (-0.4%), 200+ (-0.8%), 300+ (-1.2%), 400+ (-1.6%), 500+ (-2%) per upgrade.",
          )}
          <p>{_("In easy mode the reduction is only half as effective.")}</p>
        </div>
        <div style={{ marginTop: "1em", color: TEXT_TERTIARY }}>
          {_("Current Level: {{x}}").replace("{{x}}", currBerserker)}
        </div>
        <MenuButton
          disabled={!canUpgradeBerserker}
          onClick={onUpgradeBerserker}
          style={{
            marginTop: "1.5em",
            color: canUpgradeBerserker ? "black" : TEXT_PRIMARY,
            background: canUpgradeBerserker ? MAIN_COLOR : BG_TERTIARY,
            opacity: canUpgradeBerserker ? 1 : 0.7,
          }}
        >
          {berserkerLevel >= BERSERKER_SKILL_MAX_LEVEL
            ? _("MAXED")
            : _("Upgrade")}
        </MenuButton>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1em",
            alignItems: "center",
          }}
        >
          <div style={{ color: MAIN_COLOR, fontSize: "1.1em" }}>
            {_("Golden Touch")}
          </div>
          <div>
            {_("LEVEL")} {goldenTouchLevel}/{GOLDEN_TOUCH_SKILL_MAX_LEVEL}
          </div>
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_(
            "Pressing the golden button increases the monster's level more than usual, +1 level per upgrade.",
          )}
        </div>
        <div style={{ marginTop: "1em", color: TEXT_TERTIARY }}>
          {_("Current Level: {{x}}").replace("{{x}}", currGoldenTouch)}
        </div>
        <MenuButton
          disabled={!canUpgradeGoldenTouch}
          onClick={onUpgradeGoldenTouch}
          style={{
            marginTop: "1.5em",
            color: canUpgradeGoldenTouch ? "black" : TEXT_PRIMARY,
            background: canUpgradeGoldenTouch ? MAIN_COLOR : BG_TERTIARY,
            opacity: canUpgradeGoldenTouch ? 1 : 0.7,
          }}
        >
          {goldenTouchLevel >= GOLDEN_TOUCH_SKILL_MAX_LEVEL
            ? _("MAXED")
            : _("Upgrade")}
        </MenuButton>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1em",
            alignItems: "center",
          }}
        >
          <div style={{ color: MAIN_COLOR, fontSize: "1.1em" }}>
            {_("Life Steal")}
          </div>
          <div>
            {_("LEVEL")} {lifeStealLevel}/{LIFE_STEAL_SKILL_MAX_LEVEL}
          </div>
        </div>
        <div style={{ marginTop: "1em", lineHeight: 1.6 }}>
          {_(
            "Each correct answer has a {{base}}% chance of restoring +1 energy, plus an additional +{{inc}}% chance per upgrade.",
          )
            .replace("{{base}}", String(LIFE_STEAL_BASE_CHANCE))
            .replace("{{inc}}", String(LIFE_STEAL_CHANCE_PER_LEVEL))}
        </div>
        <div style={{ marginTop: "1em", color: TEXT_TERTIARY }}>
          {_("Current Level: {{x}}").replace("{{x}}", currLifeSteal)}
        </div>
        <MenuButton
          disabled={!canUpgradeLifeSteal}
          onClick={onUpgradeLifeSteal}
          style={{
            marginTop: "1.5em",
            color: canUpgradeLifeSteal ? "black" : TEXT_PRIMARY,
            background: canUpgradeLifeSteal ? MAIN_COLOR : BG_TERTIARY,
            opacity: canUpgradeLifeSteal ? 1 : 0.7,
          }}
        >
          {lifeStealLevel >= LIFE_STEAL_SKILL_MAX_LEVEL
            ? _("MAXED")
            : _("Upgrade")}
        </MenuButton>
      </div>

      <MenuButton
        onClick={onBack}
        style={{
          color: TEXT_PRIMARY,
          backgroundColor: BG_SECONDARY,
          marginTop: "1em",
        }}
      >
        {_("Back")}
      </MenuButton>
    </div>
  );
}
