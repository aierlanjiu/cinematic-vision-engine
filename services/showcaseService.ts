import { GeneratedImage } from '../types';
import { IconAssets } from './assetLoader';
import { generateShowcaseImage } from './geminiService';
import { SHOWCASE_PROMPTS, WATERMARK_INSTRUCTION } from '../constants';

export type SceneType = 'blur' | 'studio' | 'office' | 'gaming';

export interface RenderedAsset {
    type: 'mockup' | 'wallpaper' | 'clean' | 'poster';
    label: string;
    url: string;
    resolution: string;
    blob?: Blob;
}

// --- DRAWING HELPERS ---

const drawIcon = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number) => {
    if (!img) return;
    ctx.save();
    ctx.translate(x, y);
    // SVGs are black by default, invert to make them white
    ctx.filter = 'brightness(0) invert(1) drop-shadow(0px 2px 4px rgba(0,0,0,0.3))';
    ctx.globalAlpha = 0.9;
    ctx.drawImage(img, 0, 0, size, size);
    ctx.restore();
};

const drawWatermarkOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, serial: string, icons: IconAssets) => {
    ctx.save();

    // 1. Premium Glass Gradient Footer (Taller for centered design)
    const gradientHeight = height * 0.22;
    const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.3, 'rgba(0,0,0,0.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

    // Layout Constants - Centered Design
    const centerX = width / 2;
    const brandingY = height - (width * 0.08);
    const iconsY = height - (width * 0.045);
    const copyrightY = height - (width * 0.018);

    // 2. CENTER: Large Calligraphy Branding
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Main Brand Text - Large Calligraphy Style (Ma Shan Zheng)
    ctx.font = `400 ${width * 0.07}px "Ma Shan Zheng", cursive`;
    ctx.fillStyle = '#FFFFFF';
    ctx.letterSpacing = '0.02em';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 2;
    ctx.fillText("雪沐江南", centerX, brandingY);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 3. CENTER: Tech Stack Icons (Horizontal Row)
    const iconSize = width * 0.028;
    const iconSpacing = width * 0.045;
    const totalIconWidth = (iconSpacing * 3); // 4 icons, 3 gaps
    let currentX = centerX - totalIconWidth / 2;

    // Draw icons left-to-right (centered)
    if (icons.apple) {
        drawIcon(ctx, icons.apple, currentX - iconSize / 2, iconsY - iconSize / 2, iconSize);
    }
    currentX += iconSpacing;

    if (icons.android) {
        drawIcon(ctx, icons.android, currentX - iconSize / 2, iconsY - iconSize / 2, iconSize);
    }
    currentX += iconSpacing;

    if (icons.harmony) {
        drawIcon(ctx, icons.harmony, currentX - iconSize / 2, iconsY - iconSize / 2, iconSize);
    }
    currentX += iconSpacing;

    // 4K Badge
    if (icons.badge) {
        drawIcon(ctx, icons.badge, currentX - iconSize / 2, iconsY - iconSize / 2, iconSize);
    }

    // 4. CENTER: Serial & Copyright
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 ${width * 0.0095}px "Inter", -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.letterSpacing = '0.08em';
    ctx.fillText(`${serial} • 2025 ALL RIGHTS RESERVED`, centerX, copyrightY);

    ctx.restore();
};

const applyWatermarkToImage = async (
    base64Image: string,
    serial: string,
    icons: IconAssets
): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                drawWatermarkOverlay(ctx, canvas.width, canvas.height, serial, icons);
                resolve(canvas.toDataURL('image/png', 0.95));
            } else {
                resolve(base64Image);
            }
        };
        img.src = base64Image;
    });
};

const fillPrompt = (template: string, image: GeneratedImage, serial: string) => {
    const meta = image.metadata || {};
    const pipeline = image.pipeline || 'A';

    // Infer theme color if not present
    let themeColor = meta.themeColor;
    if (!themeColor) {
        if (pipeline === 'B') themeColor = 'red';
        else if (pipeline === 'C') themeColor = 'blue';
        else themeColor = 'gold';
    }

    const lighting = pipeline === 'B' ? 'high contrast neon' : (pipeline === 'C' ? 'dramatic volumetric' : 'soft studio');

    return template
        .replace(/\${env.lighting}/g, lighting)
        .replace(/\${themeColor}/g, themeColor)
        .replace(/\${batchId}/g, serial)
        .replace(/\${entityName}/g, meta.entityName || meta.charName || 'Character')
        .replace(/\${universeName}/g, meta.ipName || 'CinematicVision')
        .replace(/\${charName}/g, meta.charName || 'Subject')
        .replace(/\${watermarkInstruction}/g, WATERMARK_INSTRUCTION);
};

// --- MAIN GENERATOR FUNCTION ---

export const generateShowcaseAssets = async (
    image: GeneratedImage,
    icons: IconAssets,
    serialNumber: string,
    scene: any = 'blur',
    bgModel: string = 'gemini-3-pro-image-preview'
): Promise<RenderedAsset[]> => {
    const newAssets: RenderedAsset[] = [];
    const isWide = image.aspectRatio === '21:9';

    // --- LOGIC: ORIENTATION SPECIFIC SHOWCASES ---

    if (isWide) {
        // --- WIDE (21:9) -> DESKTOP MONITOR SETUP ---
        try {
            // Use the new specific desktopMonitor prompt for wide images
            const prompt = fillPrompt(SHOWCASE_PROMPTS.desktopMonitor, image, serialNumber);
            // Generate in 3:4 for the showcase image itself to capture the desk width
            const url = await generateShowcaseImage(image.url, prompt, '3:4', bgModel);

            newAssets.push({
                type: 'mockup',
                label: 'Desktop Setup (Ultrawide)',
                url: url,
                resolution: '3:4'
            });
        } catch (e) {
            console.error("Failed to generate Desktop Setup", e);
        }

    } else {
        // --- VERTICAL (9:16) -> PHONE MOCKUP ---
        try {
            const prompt = fillPrompt(SHOWCASE_PROMPTS.phoneMockup, image, serialNumber);
            const url = await generateShowcaseImage(image.url, prompt, '3:4', bgModel);

            newAssets.push({
                type: 'mockup',
                label: 'Phone Mockup (3:4)',
                url: url,
                resolution: '3:4'
            });
        } catch (e) {
            console.error("Failed to generate Phone Mockup", e);
        }
    }

    // --- SOCIAL MEDIA NOTE (3:4) ---
    try {
        const prompt = fillPrompt(SHOWCASE_PROMPTS.socialNote, image, serialNumber);
        const url = await generateShowcaseImage(image.url, prompt, '3:4', bgModel);

        newAssets.push({
            type: 'poster',
            label: 'Social Media Note',
            url: url,
            resolution: '3:4'
        });
    } catch (e) {
        console.error("Failed to generate Social Note", e);
    }

    return newAssets;
};
