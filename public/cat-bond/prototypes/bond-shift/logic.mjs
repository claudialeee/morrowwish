// Pure, deterministic rules for the independent Bond Shift challenger prototype.
// No production saves, no DOM, no shared global state.
export const STAGES = Object.freeze(['encounter', 'together', 'apart', 'reunion', 'complete']);
export const FORMS = Object.freeze({
  hunter: Object.freeze({ name:'疾风猎手', speed:224, attackRange:92, attackDamage:18, attackCooldown:.36, role:'melee-burst' }),
  guardian: Object.freeze({ name:'潮汐守卫', speed:162, attackRange:285, attackDamage:13, attackCooldown:.63, role:'ranged-protection' })
});
export function nextStage(stage) {
  const index = STAGES.indexOf(stage);
  if (index < 0) throw new Error('Unknown prototype stage: ' + stage);
  return STAGES[Math.min(index + 1, STAGES.length - 1)];
}
export function canUseGuardian(unlocked) { return unlocked === true; }
export function bondTier(trust, reunited) {
  if (reunited) return 'renewed';
  if (trust >= 20) return 'remembered';
  return 'forming';
}
export function shieldStrength({ guardianUnlocked, reunited, companionPresent }) {
  if (!guardianUnlocked) return 0;
  if (reunited) return 1.4;
  return companionPresent ? 1 : .68; // Departure retains a useful, but weaker, echo.
}
export function canIntercept({ guarding, distanceToCompanion, companionPresent, enemyTarget }) {
  return guarding && companionPresent && enemyTarget === 'companion' && distanceToCompanion <= 135;
}
export function chapterGoal(stage) {
  return ({
    encounter:'保护陌生的小雾，击退来袭者',
    together:'试着使用两种形态，保护并肩作战的伙伴',
    apart:'小雾去寻找旧友了。带着留下的回忆继续战斗',
    reunion:'小雾回来了。利用强化的守卫形态完成挑战',
    complete:'原型结束：你已经体验完整的羁绊循环'
  })[stage] || '';
}
export function compareForms(hunterHits, guardianHits) {
  return hunterHits > 0 && guardianHits > 0; // Real form use, not just tapping a toggle.
}
