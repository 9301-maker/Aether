import { audioManager } from './audio';

export type CrazyGamesAdType = 'midgame' | 'rewarded';

export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

interface CrazyGamesSdkHandle {
  init?: () => Promise<void> | void;
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
  };
  ad?: {
    requestAd?: (type: CrazyGamesAdType, callbacks: CrazyGamesAdCallbacks) => void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSdkHandle;
    };
  }
}

class CrazyGamesBridge {
  private initialized = false;
  private isPlaying = false;
  private adPending = false;
  private scriptInjected = false;

  init(): void {
    if (typeof window === 'undefined') return;
    if (window.CrazyGames?.SDK) {
      this.ensureSdkInitialized();
      return;
    }

    const host = window.location.hostname || '';
    const params = new URLSearchParams(window.location.search);
    const shouldLoadSdk =
      host.includes('crazygames') ||
      host.includes('1001juegos') ||
      params.get('cg') === '1';

    if (!shouldLoadSdk || this.scriptInjected) return;
    this.scriptInjected = true;

    const script = document.createElement('script');
    script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
    script.async = true;
    script.onload = () => this.ensureSdkInitialized();
    script.onerror = () => {
      // Ignore gracefully when offline or outside CrazyGames
    };
    document.head.appendChild(script);
  }

  private ensureSdkInitialized(): void {
    if (this.initialized) return;
    const sdk = typeof window !== 'undefined' ? window.CrazyGames?.SDK : undefined;
    if (!sdk) return;
    this.initialized = true;
    try {
      const maybePromise = sdk.init?.();
      if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
        (maybePromise as Promise<void>).catch(() => {
          // Ignore non-CrazyGames environment init rejection
        });
      }
    } catch {
      // Safe fallback
    }
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.CrazyGames?.SDK);
  }

  gameplayStart(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.ensureSdkInitialized();
    try {
      window.CrazyGames?.SDK?.game?.gameplayStart?.();
    } catch {
      // ignore
    }
  }

  gameplayStop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.ensureSdkInitialized();
    try {
      window.CrazyGames?.SDK?.game?.gameplayStop?.();
    } catch {
      // ignore
    }
  }

  happytime(): void {
    this.ensureSdkInitialized();
    try {
      window.CrazyGames?.SDK?.game?.happytime?.();
    } catch {
      // ignore
    }
  }

  requestRewardedAd(onReward: () => void, onEnd?: () => void): boolean {
    if (this.adPending) return false;
    this.ensureSdkInitialized();
    const requestAd = window.CrazyGames?.SDK?.ad?.requestAd;
    if (!requestAd) return false;

    this.adPending = true;
    try {
      requestAd('rewarded', {
        adStarted: () => {
          audioManager.setAdMuted(true);
        },
        adFinished: () => {
          this.adPending = false;
          audioManager.setAdMuted(false);
          onReward();
          onEnd?.();
        },
        adError: () => {
          this.adPending = false;
          audioManager.setAdMuted(false);
          onEnd?.();
        },
      });
      return true;
    } catch {
      this.adPending = false;
      audioManager.setAdMuted(false);
      return false;
    }
  }
}

export const crazyGames = new CrazyGamesBridge();
