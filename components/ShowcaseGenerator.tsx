import React, { useEffect, useState } from 'react';
import { GeneratedImage } from '../types';
import { generateShowcaseAssets, RenderedAsset, SceneType } from '../services/showcaseService';
import { loadIcons, IconAssets } from '../services/assetLoader';

interface ShowcaseGeneratorProps {
    image: GeneratedImage;
    onClose: () => void;
}

export const ShowcaseGenerator: React.FC<ShowcaseGeneratorProps> = ({ image, onClose }) => {
    const [assets, setAssets] = useState<RenderedAsset[]>([]);
    const [isProcessing, setIsProcessing] = useState(true);
    const [loadingStep, setLoadingStep] = useState('');

    // Configuration State
    const [serialNumber, setSerialNumber] = useState(`SMJN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    const [selectedScene, setSelectedScene] = useState<SceneType>('blur');
    const [bgModel, setBgModel] = useState<string>('gemini-3-pro-image-preview');
    const [cachedBackgrounds, setCachedBackgrounds] = useState<Record<string, string>>({});
    const [icons, setIcons] = useState<IconAssets | null>(null);

    // Load Icons on Mount
    useEffect(() => {
        const init = async () => {
            try {
                const loadedIcons = await loadIcons();
                setIcons(loadedIcons);
            } catch (e) {
                console.error("Failed to load icons", e);
            }
        };
        init();
    }, []);

    const generateAssets = async () => {
        if (!icons) return;
        setIsProcessing(true);
        setLoadingStep('Rendering Assets...');

        try {
            const newAssets = await generateShowcaseAssets(
                image,
                icons,
                serialNumber,
                selectedScene,
                bgModel
            );
            setAssets(newAssets);

        } catch (e) {
            console.error("Showcase Error", e);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (icons) {
            generateAssets();
        }
    }, [selectedScene, bgModel, icons]);

    const handleForceUpdate = () => {
        if (selectedScene !== 'blur') {
            setCachedBackgrounds(prev => {
                const n = { ...prev };
                delete n[selectedScene];
                return n;
            });
        }
        generateAssets();
    };

    if (isProcessing && assets.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-t-2 border-l-2 border-amber-500 animate-spin"></div>
                    <div className="text-center">
                        <div className="text-amber-500 text-xl font-serif tracking-widest mb-2">STUDIO GOLD RENDERING</div>
                        <div className="text-white/50 text-xs font-mono animate-pulse">{loadingStep}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8">
            <div className="w-full max-w-7xl h-full flex flex-col gap-6">

                {/* CONTROL BAR */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                        <h2 className="text-2xl font-serif text-amber-500 tracking-tight flex items-center gap-2">
                            <span className="font-cursive text-3xl">雪沐江南</span>
                            <span className="text-white/80 font-sans text-sm tracking-widest opacity-50">STUDIO</span>
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">

                        <div className="flex items-center gap-1 px-2 border-r border-white/10">
                            {(['blur', 'studio', 'office', 'gaming'] as SceneType[]).map(scene => (
                                <button
                                    key={scene}
                                    onClick={() => setSelectedScene(scene)}
                                    className={`
                                text-[10px] uppercase font-bold px-3 py-2 rounded-lg transition-all
                                ${selectedScene === scene
                                            ? 'bg-amber-500 text-black shadow-lg scale-105'
                                            : 'text-white/50 hover:bg-white/10 hover:text-white'}
                            `}
                                >
                                    {scene === 'blur' ? 'Soft Focus' : scene}
                                </button>
                            ))}
                        </div>

                        {selectedScene !== 'blur' && (
                            <div className="flex flex-col px-2 border-r border-white/10">
                                <label className="text-[9px] text-white/30 uppercase font-bold">AI Engine</label>
                                <select
                                    value={bgModel}
                                    onChange={(e) => setBgModel(e.target.value)}
                                    className="bg-transparent text-white text-xs font-mono focus:outline-none"
                                >
                                    <option value="gemini-3-pro-image-preview" className="bg-black">Pro (4K Cinema)</option>
                                </select>
                            </div>
                        )}

                        <div className="flex flex-col px-2">
                            <label className="text-[9px] text-white/30 uppercase font-bold">Serial Number</label>
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                className="bg-transparent text-amber-400 font-mono text-sm focus:outline-none w-32"
                            />
                        </div>

                        <button
                            onClick={handleForceUpdate}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                            title="Regenerate"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>

                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">

                        {/* PREVIEW: MOCKUPS */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <h3 className="text-lg font-light text-white tracking-widest">VISUAL MOCKUPS</h3>
                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">GOLD EDITION</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {assets.filter(a => a.type === 'mockup').map((asset, idx) => (
                                    <div key={idx} className="group relative flex flex-col">
                                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a] aspect-[3/4] transition-transform duration-500 hover:scale-[1.01]">
                                            <img src={asset.url} alt={asset.label} className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center">
                                                <a
                                                    href={asset.url}
                                                    download={`SMJN_SHOWCASE_${selectedScene}_${asset.label}.png`}
                                                    className="px-8 py-3 bg-white text-black rounded-full font-bold tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                                                >
                                                    DOWNLOAD
                                                </a>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-between items-center px-1">
                                            <span className="text-sm text-white/70 font-medium">{asset.label}</span>
                                            <span className="text-[10px] text-white/30 font-mono border border-white/10 px-1.5 py-0.5 rounded">1536 x 2048</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SIDEBAR: ASSETS */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <h3 className="text-lg font-light text-white tracking-widest">SOURCE ASSETS</h3>
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30">READY FOR USE</span>
                            </div>

                            <div className="space-y-6">
                                {assets.filter(a => a.type !== 'mockup').map((asset, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 group">
                                        <div className="relative rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/40">
                                            <img src={asset.url} alt={asset.label} className="w-full h-auto object-contain max-h-[350px]" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a
                                                    href={asset.url}
                                                    download={`SMJN_ASSET_${asset.type.toUpperCase()}_${serialNumber}.png`}
                                                    className="px-6 py-2 bg-white text-black rounded-full font-bold text-xs hover:scale-105 transition-transform"
                                                >
                                                    SAVE IMAGE
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-white/80 text-sm font-medium">{asset.label}</span>
                                                {asset.type === 'wallpaper' && <span className="text-[10px] text-amber-400">Includes Gold Watermark</span>}
                                            </div>
                                            <span className="text-white/30 text-[10px] font-mono bg-white/5 px-2 py-1 rounded">{asset.resolution}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white/40 leading-relaxed font-mono">
                                <p className="mb-2 text-white/60 font-bold">LICENSING NOTE:</p>
                                All assets include the "雪沐江南" Gold Edition watermark ID for distribution.
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};