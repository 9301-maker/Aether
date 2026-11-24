import { BACKUP_SAVE_KEY, PRIMARY_SAVE_KEY } from './config';
import {
  createDefaultSaveData,
  decodeAndValidateSave,
  validateSaveObject,
} from './rules';
import { SaveData } from './types';

export class SaveManager {
  load(): { data: SaveData; recoveredFromBackup: boolean } {
    try {
      const primaryRaw = localStorage.getItem(PRIMARY_SAVE_KEY);
      if (primaryRaw) {
        const parsed = validateSaveObject(JSON.parse(primaryRaw));
        if (parsed) {
          return { data: parsed, recoveredFromBackup: false };
        }
      }
    } catch {
      // fall through to backup
    }

    try {
      const backupRaw = localStorage.getItem(BACKUP_SAVE_KEY);
      if (backupRaw) {
        const parsed = validateSaveObject(JSON.parse(backupRaw));
        if (parsed) {
          this.save(parsed);
          return { data: parsed, recoveredFromBackup: true };
        }
      }
    } catch {
      // fall through to default
    }

    const fresh = createDefaultSaveData();
    this.save(fresh);
    return { data: fresh, recoveredFromBackup: false };
  }

  save(data: SaveData): void {
    const validated = validateSaveObject(data);
    if (!validated) return;
    try {
      const json = JSON.stringify(validated);
      localStorage.setItem(PRIMARY_SAVE_KEY, json);
      localStorage.setItem(BACKUP_SAVE_KEY, json);
    } catch {
      // ignore storage quota errors gracefully
    }
  }

  importSave(encodedOrJson: string): SaveData | null {
    const validated = decodeAndValidateSave(encodedOrJson);
    if (!validated) return null;
    this.save(validated);
    return validated;
  }

  reset(): SaveData {
    const fresh = createDefaultSaveData();
    this.save(fresh);
    return fresh;
  }
}

export const saveManager = new SaveManager();
