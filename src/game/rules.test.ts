import test from 'node:test';
import assert from 'node:assert/strict';
import { VEHICLE_DATABASE, getVehicleById } from './vehicles';
import { DIMENSIONS } from './dimensions';
import {
  advanceCombo,
  calculateObstacleHP,
  canEnterAltitude,
  createDefaultSaveData,
  decayCombo,
  decodeAndValidateSave,
  encodeSaveBase64,
  generateBossConfig,
  getEffectiveStats,
  getSignatureObstacleForTheme,
  getUpgradeCost,
  pickDimensionalRoutes,
  purchaseUpgrade,
  purchaseVehicle,
} from './rules';
import { HapticsManager } from './haptics';
import {
  buildPromptPayPayload,
  crc16Ccitt,
  hasAnyMonetizationChannel,
  normalizePromptPayTarget,
  sanitizeBankAccountDigits,
  sanitizeExternalHttpsUrl,
} from './monetization';
import { INITIAL_COINS } from './config';

test('Vehicle Database has 200 distinct vehicles across 4 categories and 8 weapons', () => {
  assert.equal(VEHICLE_DATABASE.length, 200);
  const cars = VEHICLE_DATABASE.filter((v) => v.category === 'CAR');
  const aircraft = VEHICLE_DATABASE.filter((v) => v.category === 'AIRCRAFT');
  const spaceships = VEHICLE_DATABASE.filter((v) => v.category === 'SPACESHIP');
  const hybrids = VEHICLE_DATABASE.filter((v) => v.category === 'HYBRID');

  assert.equal(cars.length, 50);
  assert.equal(aircraft.length, 50);
  assert.equal(spaceships.length, 50);
  assert.equal(hybrids.length, 50);

  const weaponSet = new Set(VEHICLE_DATABASE.map((v) => v.weaponType));
  assert.equal(weaponSet.size, 8);

  // Starter vehicle is free; #002 costs 2,000 coins; top hybrid costs ~500,000
  assert.equal(getVehicleById(1).price, 0);
  assert.equal(getVehicleById(2).price, 2000);
  assert.equal(getVehicleById(200).price, 500000);
});

test('Altitude compatibility strictly enforces Car / Aircraft / Spaceship / Hybrid rules', () => {
  const car = getVehicleById(1);
  const aircraft = getVehicleById(51);
  const spaceship = getVehicleById(101);
  const hybrid = getVehicleById(151);

  assert.equal(canEnterAltitude(car, 'GROUND'), true);
  assert.equal(canEnterAltitude(car, 'SKY'), false);
  assert.equal(canEnterAltitude(car, 'SPACE'), false);

  assert.equal(canEnterAltitude(aircraft, 'GROUND'), true);
  assert.equal(canEnterAltitude(aircraft, 'SKY'), true);
  assert.equal(canEnterAltitude(aircraft, 'SPACE'), false);

  assert.equal(canEnterAltitude(spaceship, 'GROUND'), true);
  assert.equal(canEnterAltitude(spaceship, 'SKY'), true);
  assert.equal(canEnterAltitude(spaceship, 'SPACE'), true);

  assert.equal(canEnterAltitude(hybrid, 'GROUND'), true);
  assert.equal(canEnterAltitude(hybrid, 'SKY'), true);
  assert.equal(canEnterAltitude(hybrid, 'SPACE'), true);
});

test('Purchase vehicle & upgrade never deduct coins on failure and apply stats on success', () => {
  let save = createDefaultSaveData();
  assert.equal(save.coins, INITIAL_COINS);

  // Cannot buy expensive #200 with 2000 coins
  const failBuy = purchaseVehicle(save, 200);
  assert.equal(failBuy.success, false);
  assert.equal(failBuy.save.coins, INITIAL_COINS);
  assert.deepEqual(failBuy.save.ownedVehicles, [1]);

  // Can buy #002 for 2000 coins
  const okBuy = purchaseVehicle(save, 2);
  assert.equal(okBuy.success, true);
  assert.equal(okBuy.save.coins, 0);
  assert.equal(okBuy.save.selectedVehicle, 2);
  assert.ok(okBuy.save.ownedVehicles.includes(2));

  // Cannot upgrade with 0 coins
  const failUp = purchaseUpgrade(okBuy.save, 'engine');
  assert.equal(failUp.success, false);
  assert.equal(failUp.save.upgrades.engine, 1);

  // Upgrade engine with sufficient coins increases max speed by +15 km/h at Lv.2 and +75 at Lv.5
  save = { ...save, coins: 100000 };
  const baseStats = getEffectiveStats(getVehicleById(1), save.upgrades, false);
  const up1 = purchaseUpgrade(save, 'engine');
  assert.equal(up1.success, true);
  assert.equal(up1.save.coins, 100000 - getUpgradeCost('engine', 1));
  const lv2Stats = getEffectiveStats(getVehicleById(1), up1.save.upgrades, false);
  assert.equal(lv2Stats.baseMaxSpeedKmh - baseStats.baseMaxSpeedKmh, 15);

  const lv5Stats = getEffectiveStats(
    getVehicleById(1),
    { cannon: 1, engine: 5, wings: 1, armor: 1 },
    false
  );
  assert.equal(lv5Stats.baseMaxSpeedKmh - baseStats.baseMaxSpeedKmh, 75);

  // Overdrive adds 35% to max speed
  const odStats = getEffectiveStats(getVehicleById(1), save.upgrades, true);
  assert.equal(odStats.maxSpeedKmh, Math.round(baseStats.baseMaxSpeedKmh * 1.35));
});

test('Save export/import validates schema, version, and rejects corrupted payloads', () => {
  const original = createDefaultSaveData();
  original.coins = 12345;
  original.ownedVehicles = [1, 2, 51];
  original.selectedVehicle = 51;
  original.upgrades.cannon = 4;

  const encoded = encodeSaveBase64(original);
  const decoded = decodeAndValidateSave(encoded);
  assert.ok(decoded !== null);
  assert.equal(decoded.coins, 12345);
  assert.equal(decoded.selectedVehicle, 51);
  assert.equal(decoded.upgrades.cannon, 4);

  // Reject malformed / invalid values
  assert.equal(decodeAndValidateSave('not-valid-base64!!!'), null);
  assert.equal(decodeAndValidateSave(JSON.stringify({ version: 999, coins: 100 })), null);
  assert.equal(decodeAndValidateSave(JSON.stringify({ version: 1, coins: -500, ownedVehicles: [1] })), null);
});

test('20 Dimensions, Route Picker, Combo, Obstacle HP, and 200 Boss Configs work cleanly', () => {
  assert.equal(DIMENSIONS.length, 20);
  const signatureHazards = new Set(DIMENSIONS.map((d) => getSignatureObstacleForTheme(d.propTheme)));
  assert.equal(signatureHazards.size, 20);

  const routes = pickDimensionalRoutes(1, 3);
  assert.equal(routes.length, 3);
  assert.ok(routes.every((r) => r.dimension.id !== 1));

  assert.equal(advanceCombo(4.8, 0.5), 5.0);
  assert.equal(decayCombo(1.2), 1.0);
  assert.ok(calculateObstacleHP(60, 0) === 60);
  assert.ok(calculateObstacleHP(60, 5500) > 60);

  const b1 = generateBossConfig(1, 5000);
  const b2 = generateBossConfig(2, 10000);
  assert.notEqual(b1.name, b2.name);
  assert.ok(b2.maxHp > b1.maxHp);
});

test('Vibration API HapticsManager fires patterns with throttling and safe disabled/unsupported handling', () => {
  const calls: Array<number | number[]> = [];
  const mockNav = {
    vibrate: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
  };

  const hm = new HapticsManager();
  assert.equal(hm.trigger('weapon', 100, mockNav), true);
  // Throttled within 85ms cooldown
  assert.equal(hm.trigger('weapon', 130, mockNav), false);
  // Allowed after cooldown
  assert.equal(hm.trigger('weapon', 200, mockNav), true);

  // Collision triggers heavy pattern immediately
  assert.equal(hm.trigger('collision', 210, mockNav), true);
  assert.equal(hm.trigger('powerup', 220, mockNav), true);

  // Disabled state suppresses vibration
  hm.setEnabled(false);
  assert.equal(hm.trigger('collision', 500, mockNav), false);

  // Unsupported environment returns false cleanly
  hm.setEnabled(true);
  assert.equal(hm.trigger('coin', 600, {}), false);
  assert.equal(calls.length, 4);
});

test('PromptPay EMVCo QR generator & URL sanitizer validate inputs and compute CRC16 cleanly', () => {
  const mobile = normalizePromptPayTarget('081-234-5678');
  assert.ok(mobile !== null);
  assert.equal(mobile.subTag, '01');
  assert.equal(mobile.formatted, '0066812345678');

  const payload50 = buildPromptPayPayload('0812345678', 50);
  assert.ok(payload50 !== null);
  assert.ok(payload50.startsWith('000201010212'));
  assert.ok(payload50.includes('0016A00000067701011101130066812345678'));
  assert.ok(payload50.includes('5303764540550.005802TH6304'));
  const body = payload50.slice(0, -4);
  const crc = payload50.slice(-4);
  assert.equal(crc, crc16Ccitt(body));

  // Open-amount QR omits Tag 54 and uses 010211
  const openQr = buildPromptPayPayload('0812345678');
  assert.ok(openQr !== null);
  assert.ok(openQr.startsWith('000201010211'));
  assert.ok(!openQr.includes('5405'));

  // Invalid PromptPay targets and non-HTTPS URLs are rejected
  assert.equal(buildPromptPayPayload('12345'), null);
  assert.equal(sanitizeExternalHttpsUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeExternalHttpsUrl('http://ko-fi.com/test'), null);
  assert.equal(sanitizeExternalHttpsUrl('https://ko-fi.com/aetherhorizon'), 'https://ko-fi.com/aetherhorizon');

  // Bank account validation & active channel detection
  assert.equal(sanitizeBankAccountDigits('123-4-56789-0'), '123-4-56789-0');
  assert.equal(sanitizeBankAccountDigits('1234'), null);
  assert.equal(
    hasAnyMonetizationChannel({
      promptpayId: null,
      bankName: 'KBank',
      bankAccount: '123-4-56789-0',
      bankHolder: null,
      kofiUrl: null,
      itchUrl: null,
    }),
    true
  );
});
