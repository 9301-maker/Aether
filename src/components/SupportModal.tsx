import QRCode from 'qrcode';
import React, { useEffect, useRef, useState } from 'react';
import { t } from '../game/localization';
import {
  buildPromptPayPayload,
  getMonetizationConfig,
  hasAnyMonetizationChannel,
  normalizePromptPayTarget,
} from '../game/monetization';
import { LanguageCode } from '../game/types';

interface SupportModalProps {
  lang: LanguageCode;
  onClose: () => void;
}

const PRESET_AMOUNTS = [20, 50, 100] as const;

export const SupportModal: React.FC<SupportModalProps> = ({ lang, onClose }) => {
  const cfg = getMonetizationConfig();
  const hasChannel = hasAnyMonetizationChannel(cfg);
  const promptpayInfo = cfg.promptpayId ? normalizePromptPayTarget(cfg.promptpayId) : null;

  const [selectedAmount, setSelectedAmount] = useState<number | undefined>(50);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payload = cfg.promptpayId ? buildPromptPayPayload(cfg.promptpayId, selectedAmount) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    void QRCode.toCanvas(canvas, payload, {
      width: 210,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  }, [payload]);

  const handleCopyAccount = () => {
    if (!cfg.bankAccount) return;
    const rawDigits = cfg.bankAccount.replace(/\D/g, '');
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(rawDigits).catch(() => {});
    }
    setCopiedAccount(true);
    window.setTimeout(() => setCopiedAccount(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, 'support_title')}
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#03060f]/85"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#090f1e] border border-amber-400/35 p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-['Chakra_Petch'] font-bold text-amber-300 tracking-wider">
            {t(lang, 'support_title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'back')}
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{t(lang, 'support_desc')}</p>

        {payload && promptpayInfo && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col items-center gap-3">
            <div className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
              {t(lang, 'support_promptpay_title')}
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <div className="text-[11px] text-slate-400 text-center">{t(lang, 'support_amount')}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                      selectedAmount === amt
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    ฿{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAmount(undefined)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    selectedAmount === undefined
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {t(lang, 'support_open_qr')}
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white">
              <canvas ref={canvasRef} data-testid="promptpay-qr-canvas" width={210} height={210} />
            </div>

            <div className="text-center">
              <div className="text-xs font-mono text-slate-200">{promptpayInfo.displayMasked}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t(lang, 'support_scan_qr')}</div>
            </div>
          </div>
        )}

        {cfg.bankName && cfg.bankAccount && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col gap-2">
            <div className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">
              {t(lang, 'support_bank_title')}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{t(lang, 'support_bank_name')}</span>
              <span className="font-semibold text-white">{cfg.bankName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{t(lang, 'support_bank_account')}</span>
              <span className="font-mono font-bold text-amber-300">{cfg.bankAccount}</span>
            </div>
            {cfg.bankHolder && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{t(lang, 'support_bank_holder')}</span>
                <span className="text-slate-200">{cfg.bankHolder}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleCopyAccount}
              className="mt-1 w-full py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs tracking-wide cursor-pointer transition-colors"
            >
              {copiedAccount ? t(lang, 'support_copied') : t(lang, 'support_copy_account')}
            </button>
          </div>
        )}

        {(cfg.kofiUrl || cfg.itchUrl) && (
          <div className="flex flex-col gap-2">
            {cfg.kofiUrl && (
              <a
                href={cfg.kofiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm text-center transition-colors"
              >
                {t(lang, 'support_kofi')}
              </a>
            )}
            {cfg.itchUrl && (
              <a
                href={cfg.itchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm text-center transition-colors"
              >
                {t(lang, 'support_itch')}
              </a>
            )}
          </div>
        )}

        {!hasChannel && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {t(lang, 'support_not_configured')}
          </div>
        )}
      </div>
    </div>
  );
};
