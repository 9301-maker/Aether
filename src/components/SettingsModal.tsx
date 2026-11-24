import React, { useState } from 'react';
import { LANGUAGE_LABELS, t } from '../game/localization';
import { encodeSaveBase64 } from '../game/rules';
import { GameSettings, GraphicsQuality, LanguageCode, SaveData } from '../game/types';

interface SettingsModalProps {
  save: SaveData;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onChangeLanguage: (lang: LanguageCode) => void;
  onImportSave: (encoded: string) => boolean;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  save,
  onUpdateSettings,
  onChangeLanguage,
  onImportSave,
  onResetSave,
  onClose,
}) => {
  const lang = save.language;
  const [exportStr, setExportStr] = useState('');
  const [importStr, setImportStr] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const encoded = encodeSaveBase64(save);
    setExportStr(encoded);
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(encoded).catch(() => {});
    }
    setStatusMsg(t(lang, 'export_copied'));
  };

  const handleImport = () => {
    const ok = onImportSave(importStr);
    setStatusMsg(t(lang, ok ? 'import_success' : 'import_error'));
    if (ok) setImportStr('');
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#03060f]/85">
      <div className="w-full max-w-2xl rounded-2xl bg-[#090f1e] border border-slate-700 p-5 sm:p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-['Chakra_Petch'] font-bold text-white tracking-wider">
            {t(lang, 'settings')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'back')}
          </button>
        </div>

        {/* Language & Graphics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-lang" className="text-xs font-semibold text-slate-300">
              {t(lang, 'settings_language')}
            </label>
            <select
              id="settings-lang"
              value={lang}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
            >
              {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                <option key={code} value={code} className="bg-slate-900">
                  {LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-gfx" className="text-xs font-semibold text-slate-300">
              {t(lang, 'settings_graphics')}
            </label>
            <select
              id="settings-gfx"
              value={save.settings.graphicsQuality}
              onChange={(e) => onUpdateSettings({ graphicsQuality: e.target.value as GraphicsQuality })}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
            >
              {(['AUTO', 'LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map((q) => (
                <option key={q} value={q} className="bg-slate-900">
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Sliders & Toggles */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            {t(lang, 'settings_audio')}
          </div>
          {(
            [
              ['masterVolume', 'settings_master'],
              ['musicVolume', 'settings_music'],
              ['sfxVolume', 'settings_sfx'],
            ] as const
          ).map(([field, labelKey]) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <label htmlFor={`slider-${field}`} className="text-xs text-slate-300 w-36">
                {t(lang, labelKey)}
              </label>
              <input
                id={`slider-${field}`}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={save.settings[field]}
                onChange={(e) => onUpdateSettings({ [field]: Number(e.target.value) })}
                className="flex-1 accent-cyan-400"
              />
              <span className="text-xs font-mono tabular-nums text-slate-300 w-10 text-right">
                {Math.round(save.settings[field] * 100)}%
              </span>
            </div>
          ))}

          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={save.settings.muted}
                onChange={(e) => onUpdateSettings({ muted: e.target.checked })}
                className="accent-cyan-400"
              />
              {t(lang, 'settings_mute')}
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={save.settings.autoFire}
                onChange={(e) => onUpdateSettings({ autoFire: e.target.checked })}
                className="accent-cyan-400"
              />
              {t(lang, 'settings_autofire')}
            </label>
          </div>
        </div>

        {/* Save Export / Import / Reset */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            {t(lang, 'settings_save')}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
            >
              {t(lang, 'export_save')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                } else {
                  onResetSave();
                  setConfirmReset(false);
                }
              }}
              className="px-3.5 py-2 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-xs font-semibold text-rose-100 cursor-pointer"
            >
              {confirmReset ? t(lang, 'reset_confirm') : t(lang, 'reset_save')}
            </button>
          </div>

          {exportStr && (
            <textarea
              readOnly
              value={exportStr}
              aria-label="Exported Save Base64"
              rows={2}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
            />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={importStr}
              onChange={(e) => setImportStr(e.target.value)}
              placeholder="Paste Base64 save string..."
              aria-label="Import Save String"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
            />
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold cursor-pointer"
            >
              {t(lang, 'import_save')}
            </button>
          </div>

          {statusMsg && <div className="text-xs text-cyan-300 font-semibold">{statusMsg}</div>}
        </div>
      </div>
    </div>
  );
};
