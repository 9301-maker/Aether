export type HapticEvent =
  | 'coin'
  | 'gem'
  | 'powerup'
  | 'weapon'
  | 'weapon_heavy'
  | 'hit'
  | 'explosion'
  | 'shield_absorb'
  | 'collision'
  | 'overdrive'
  | 'shift'
  | 'boss_warning'
  | 'boss_defeat';

export const HAPTIC_PATTERNS: Record<HapticEvent, number | number[]> = {
  coin: 10,
  gem: [16, 22, 22],
  powerup: [22, 28, 36],
  weapon: 10,
  weapon_heavy: 18,
  hit: 14,
  explosion: [28, 20, 18],
  shield_absorb: [45, 28, 25],
  collision: [75, 38, 115],
  overdrive: [32, 22, 48, 22, 68],
  shift: [20, 18, 32],
  boss_warning: [50, 40, 50],
  boss_defeat: [60, 35, 80, 35, 115],
};

const COOLDOWN_MS: Partial<Record<HapticEvent, number>> = {
  coin: 60,
  weapon: 85,
  weapon_heavy: 95,
  hit: 55,
};

export interface VibratorLike {
  vibrate?: (pattern: number | number[]) => boolean;
}

export class HapticsManager {
  private enabled = true;
  private lastEventTime: Partial<Record<HapticEvent, number>> = {};

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  trigger(
    event: HapticEvent,
    nowMs = Date.now(),
    nav: VibratorLike | undefined = typeof navigator !== 'undefined' ? navigator : undefined
  ): boolean {
    if (!this.enabled) return false;
    if (!nav || typeof nav.vibrate !== 'function') return false;

    const cooldown = COOLDOWN_MS[event] ?? 0;
    const prev = this.lastEventTime[event] ?? -Infinity;
    if (cooldown > 0 && nowMs - prev < cooldown) {
      return false;
    }

    this.lastEventTime[event] = nowMs;
    try {
      return Boolean(nav.vibrate(HAPTIC_PATTERNS[event]));
    } catch {
      return false;
    }
  }

  stop(
    nav: VibratorLike | undefined = typeof navigator !== 'undefined' ? navigator : undefined
  ): void {
    if (!nav || typeof nav.vibrate !== 'function') return;
    try {
      nav.vibrate(0);
    } catch {
      // Ignore if vibration call fails
    }
  }
}

export const haptics = new HapticsManager();
