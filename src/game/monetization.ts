export interface MonetizationConfig {
  promptpayId: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  kofiUrl: string | null;
  itchUrl: string | null;
}

function readViteEnv(key: string): string | undefined {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    const val = metaEnv?.[key];
    return typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function sanitizeExternalHttpsUrl(raw?: string): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function normalizePromptPayTarget(
  raw?: string
): { subTag: '01' | '02' | '03'; formatted: string; displayMasked: string } | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return {
      subTag: '01',
      formatted: `0066${digits.slice(1)}`,
      displayMasked: `${digits.slice(0, 3)}-xxx-${digits.slice(6)}`,
    };
  }
  if (digits.length === 13) {
    return {
      subTag: '02',
      formatted: digits,
      displayMasked: `${digits.slice(0, 3)}-xxxx-xxxx-${digits.slice(11)}`,
    };
  }
  if (digits.length === 15) {
    return {
      subTag: '03',
      formatted: digits,
      displayMasked: `${digits.slice(0, 4)}-xxxx-${digits.slice(11)}`,
    };
  }
  return null;
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function crc16Ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= (input.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildPromptPayPayload(rawTarget: string, amountBaht?: number): string | null {
  const normalized = normalizePromptPayTarget(rawTarget);
  if (!normalized) return null;

  const hasAmount = typeof amountBaht === 'number' && Number.isFinite(amountBaht) && amountBaht > 0;
  const merchantInfo = tlv('00', 'A000000677010111') + tlv(normalized.subTag, normalized.formatted);

  const chunks = [
    tlv('00', '01'),
    tlv('01', hasAmount ? '12' : '11'),
    tlv('29', merchantInfo),
    tlv('53', '764'),
    ...(hasAmount ? [tlv('54', amountBaht!.toFixed(2))] : []),
    tlv('58', 'TH'),
    '6304',
  ];

  const base = chunks.join('');
  return `${base}${crc16Ccitt(base)}`;
}

export function sanitizeBankAccountDigits(raw?: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9-]/g, '').trim();
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) return null;
  return cleaned;
}

const DEFAULT_BANK_NAME = 'ออมสิน (Mymo)';
const DEFAULT_BANK_ACCOUNT = '020167956174';

export function getMonetizationConfig(): MonetizationConfig {
  const rawPromptPay = readViteEnv('VITE_PROMPTPAY_ID');
  const promptpayValid = normalizePromptPayTarget(rawPromptPay) ? rawPromptPay!.trim() : null;
  const bankName = readViteEnv('VITE_BANK_NAME') ?? DEFAULT_BANK_NAME;
  const bankAccount = sanitizeBankAccountDigits(readViteEnv('VITE_BANK_ACCOUNT') ?? DEFAULT_BANK_ACCOUNT);
  const bankHolder = readViteEnv('VITE_BANK_HOLDER') ?? null;
  return {
    promptpayId: promptpayValid,
    bankName,
    bankAccount,
    bankHolder,
    kofiUrl: sanitizeExternalHttpsUrl(readViteEnv('VITE_KOFI_URL')),
    itchUrl: sanitizeExternalHttpsUrl(readViteEnv('VITE_ITCH_URL')),
  };
}

export function hasAnyMonetizationChannel(cfg: MonetizationConfig = getMonetizationConfig()): boolean {
  return Boolean(cfg.promptpayId || (cfg.bankName && cfg.bankAccount) || cfg.kofiUrl || cfg.itchUrl);
}
