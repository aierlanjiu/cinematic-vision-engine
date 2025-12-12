import appleIconUrl from '../svg/apple.svg';
import androidIconUrl from '../svg/android.svg';
import harmonyIconUrl from '../svg/harmonyos.svg';
import badge4kIconUrl from '../svg/badge-4k.svg';

export interface IconAssets {
    apple: HTMLImageElement;
    android: HTMLImageElement;
    harmony: HTMLImageElement;
    badge: HTMLImageElement;
}

let loadedIcons: IconAssets | null = null;

export const loadIcons = async (): Promise<IconAssets> => {
    if (loadedIcons) return loadedIcons;

    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

    try {
        const [apple, android, harmony, badge] = await Promise.all([
            load(appleIconUrl),
            load(androidIconUrl),
            load(harmonyIconUrl),
            load(badge4kIconUrl)
        ]);

        loadedIcons = {
            apple,
            android,
            harmony,
            badge
        };
        return loadedIcons;
    } catch (e) {
        console.error("Failed to load watermark icons", e);
        throw e;
    }
};
