import React, { useState, useEffect, useRef } from 'react';
import { IP_DATABASE, PIPELINES, AI_MODELS } from './constants';
import { IPData, Character, PipelineType, GeneratedImage } from './types';
import { GlassCard } from './components/GlassCard';
import { generateCinematicPrompt, generateImage } from './services/geminiService';
import { ShowcaseGenerator } from './components/ShowcaseGenerator';
import { saveImageToDB, getAllImagesFromDB, clearDB, deleteImageFromDB, saveAllImagesToDB } from './services/localDB';
import { DriveService } from './services/driveService';
import { exportGalleryToZip } from './services/zipService';
import { loadIcons } from './services/assetLoader';
import { generateShowcaseAssets } from './services/showcaseService';
import JSZip from 'jszip';

const App: React.FC = () => {
    // State
    const [selectedIP, setSelectedIP] = useState<IPData | null>(null);
    const [selectedChar, setSelectedChar] = useState<Character | null>(null);
    const [selectedPipeline, setSelectedPipeline] = useState<PipelineType | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);

    // Custom Input Mode
    const [useCustomInput, setUseCustomInput] = useState(false);
    const [customIPName, setCustomIPName] = useState('');
    const [customCharName, setCustomCharName] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('');

    const [generatedPrompts, setGeneratedPrompts] = useState<Record<string, string>>({});

    // SEPARATE STATE FOR SESSION VS HISTORY
    const [currentSessionImages, setCurrentSessionImages] = useState<GeneratedImage[]>([]);
    const [historyImages, setHistoryImages] = useState<GeneratedImage[]>([]);

    const [activeShowcaseImage, setActiveShowcaseImage] = useState<GeneratedImage | null>(null);

    // VIEW MODE: 'create' | 'gallery'
    const [viewMode, setViewMode] = useState<'create' | 'gallery'>('create');

    // Theme & Background State
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
    const [customBackground, setCustomBackground] = useState<string | null>(null);

    // CLOUD STATE
    const [showCloudModal, setShowCloudModal] = useState(false);
    const [googleClientId, setGoogleClientId] = useState('');
    const [isCloudAuthenticated, setIsCloudAuthenticated] = useState(false);
    const [driveService, setDriveService] = useState<DriveService | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
    const [zipProgress, setZipProgress] = useState<number | null>(null);

    // Load History from IndexedDB on Mount
    useEffect(() => {
        loadHistory();
        // Try to load saved client ID
        const savedClientId = localStorage.getItem('cve_google_client_id');
        if (savedClientId) {
            setGoogleClientId(savedClientId);
        }
    }, []);

    const loadHistory = async () => {
        try {
            const history = await getAllImagesFromDB();
            setHistoryImages(history);
        } catch (e) {
            console.error("Failed to load local database:", e);
        }
    };

    // --- CLOUD HANDLERS ---
    const initDrive = async () => {
        if (!googleClientId) return;
        localStorage.setItem('cve_google_client_id', googleClientId.trim());
        const service = new DriveService(googleClientId.trim());
        service.init();
        setDriveService(service);

        try {
            await service.signIn();
            setIsCloudAuthenticated(true);
        } catch (e) {
            console.error("Auth failed", e);
            // @ts-ignore
            alert(`Google Auth Failed: ${e.error || 'Check console/policy'}. \n\nNOTE: Preview domains (*.goog) are often blocked by Google Auth Policy. Use ZIP Export instead.`);
        }
    };

    const handleCloudSync = async () => {
        if (!driveService || !isCloudAuthenticated) return;
        try {
            setCurrentStatus("Backing up JSON DB to Drive...");
            await driveService.saveHistoryJSON(historyImages);
            alert("Database JSON successfully backed up to Drive.");
        } catch (e) {
            console.error(e);
            alert("Backup failed.");
        } finally {
            setCurrentStatus('');
        }
    };

    const handleExportImagesToDrive = async () => {
        if (!driveService || !isCloudAuthenticated) return;
        if (historyImages.length === 0) {
            alert("No images to export.");
            return;
        }

        try {
            setUploadProgress({ current: 0, total: historyImages.length });
            await driveService.exportGalleryToDrive(historyImages, (curr, total) => {
                setUploadProgress({ current: curr, total });
            });
            alert("All images successfully uploaded to 'Cinematic_Vision_Gallery' folder.");
        } catch (e) {
            console.error(e);
            alert("Export interrupted. Check console for details.");
        } finally {
            setUploadProgress(null);
        }
    };

    // --- ZIP EXPORT ---
    const handleZipExport = async () => {
        if (historyImages.length === 0) {
            alert("No images to export.");
            return;
        }
        try {
            setZipProgress(0);
            await exportGalleryToZip(historyImages, (percent) => {
                setZipProgress(percent);
            });
            // alert("ZIP Downloaded!");
        } catch (e) {
            console.error(e);
            alert("Failed to create ZIP archive.");
        } finally {
            setZipProgress(null);
        }
    };


    // Handlers
    const handleIPSelect = (ip: IPData) => {
        setSelectedIP(ip);
        setSelectedChar(null);
        setSelectedPipeline(null);
        setUseCustomInput(false);
    };

    const handleCharSelect = (char: Character) => {
        setSelectedChar(char);
        if (char.defaultPipeline) {
            setSelectedPipeline(char.defaultPipeline);
        }
    };

    const handleCustomModeToggle = () => {
        setUseCustomInput(!useCustomInput);
        if (!useCustomInput) {
            setSelectedIP(null);
            setSelectedChar(null);
        } else {
            setCustomIPName('');
            setCustomCharName('');
        }
    };

    const handleGenerate = async (mode: 'ALL' | 'SINGLE') => {
        // Validate inputs
        const ipName = useCustomInput ? customIPName.trim() : selectedIP?.name;
        const charName = useCustomInput ? customCharName.trim() : selectedChar?.name;

        if (!ipName || !charName) return;
        if (mode === 'SINGLE' && !selectedPipeline) return;

        setIsGenerating(true);
        setCurrentSessionImages([]);
        setGeneratedPrompts({});
        setViewMode('create');

        try {
            const tasks: { pipeline: PipelineType; ratio: string; label: string; promptPromise: Promise<string> }[] = [];

            // 1. Prepare Prompts & Tasks
            if (mode === 'ALL') {
                setCurrentStatus('Synthesizing All Visual Echoes...');
                // Fire off 3 prompt requests in parallel for speed
                const promptPromises = {
                    A: generateCinematicPrompt(charName, ipName, 'A'),
                    B: generateCinematicPrompt(charName, ipName, 'B'),
                    C: generateCinematicPrompt(charName, ipName, 'C'),
                };

                (['A', 'B', 'C'] as PipelineType[]).forEach(p => {
                    tasks.push({ pipeline: p, ratio: '9:16', label: `Pipeline ${p} Vertical`, promptPromise: promptPromises[p] });
                    tasks.push({ pipeline: p, ratio: '21:9', label: `Pipeline ${p} Wide`, promptPromise: promptPromises[p] });
                });
            } else {
                // Single Mode
                setCurrentStatus(`Synthesizing Pipeline ${selectedPipeline}...`);
                const promptPromise = generateCinematicPrompt(charName, ipName, selectedPipeline!);
                tasks.push({ pipeline: selectedPipeline!, ratio: '9:16', label: `Pipeline ${selectedPipeline} Vertical`, promptPromise });
                tasks.push({ pipeline: selectedPipeline!, ratio: '21:9', label: `Pipeline ${selectedPipeline} Wide`, promptPromise });
            }

            const timestamp = Date.now();

            // 3. Execute Sequentially with Delay
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];

                try {
                    // Wait for prompt if it's still generating
                    const prompt = await task.promptPromise;
                    setGeneratedPrompts(prev => ({ ...prev, [task.pipeline]: prompt }));

                    setCurrentStatus(`Rendering ${task.label} (${i + 1}/${tasks.length})...`);

                    // Add unique seed to prevent duplicates
                    const seed = Math.floor(Math.random() * 99999);
                    const taskPrompt = `${prompt} --seed ${seed}`;

                    // Generate
                    const url = await generateImage(taskPrompt, task.ratio as any, selectedModel);

                    // Create Image Object
                    const imgObj: GeneratedImage = {
                        id: `${task.pipeline}-${task.ratio === '21:9' ? 'w' : 'v'}-${timestamp}-${i}`,
                        url,
                        aspectRatio: task.ratio,
                        prompt,
                        timestamp,
                        model: selectedModel,
                        pipeline: task.pipeline,
                        commonId: `CID-${timestamp}`,
                        metadata: {
                            charName: charName,
                            ipName: ipName,
                            // themeColor: selectedChar?.themeColor // If I added it to type, but I didn't yet.
                        }
                    };

                    // Save immediately so user sees progress
                    setCurrentSessionImages(prev => [...prev, imgObj]);
                    await saveImageToDB(imgObj);

                    // Wait 1.5s between requests to respect Rate Limits
                    if (i < tasks.length - 1) {
                        await new Promise(r => setTimeout(r, 1500));
                    }

                } catch (err: any) {
                    console.error(`Failed to generate ${task.label}:`, err);
                    // Continue to next image even if one fails
                    setCurrentStatus(`Error on ${task.label}, skipping...`);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            loadHistory();

        } catch (e: any) {
            console.error(e);
            const errorMsg = e.message || 'Unknown Error';
            setCurrentStatus(`ERROR: ${errorMsg}`);
        } finally {
            setIsGenerating(false);
            if (!currentStatus.startsWith('ERROR')) {
                setCurrentStatus('');
            }
        }
    };

    const handleClearHistory = async () => {
        if (window.confirm("Are you sure you want to delete all history?")) {
            await clearDB();
            setHistoryImages([]);
            setCurrentSessionImages([]);
        }
    };

    const handleDeleteImage = async (id: string) => {
        if (window.confirm("Delete this image?")) {
            await deleteImageFromDB(id);
            loadHistory();
        }
    };

    // --- DATA EXPORT / IMPORT (Backup) ---
    const handleExportData = () => {
        const dataStr = JSON.stringify(historyImages);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `CVE_Backup_${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // --- BUNDLE DOWNLOAD HANDLERS ---
    const handleDownloadBundle = async (img: GeneratedImage) => {
        try {
            setCurrentStatus("Preparing Download Package...");
            const icons = await loadIcons();
            const serial = `SMJN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const assets = await generateShowcaseAssets(img, icons, serial);

            const zip = new JSZip();
            const folder = zip.folder(`Bundle_${img.id}`);

            if (folder) {
                // Add original
                const originalBase64 = img.url.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
                folder.file(`Original_${img.id}.png`, originalBase64, { base64: true });

                // Add assets
                assets.forEach(asset => {
                    const assetBase64 = asset.url.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
                    folder.file(`${asset.label.replace(/\s+/g, '_')}.png`, assetBase64, { base64: true });
                });
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Bundle_${img.id}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error(e);
            alert("Failed to download bundle.");
        } finally {
            setCurrentStatus("");
        }
    };

    const handleDownloadAllBundles = async (commonId: string) => {
        // Find all images with this commonId
        const images = [...currentSessionImages, ...historyImages].filter(img => img.commonId === commonId);
        if (images.length === 0) return;

        try {
            setCurrentStatus(`Packaging ${images.length} Variants...`);
            const icons = await loadIcons();
            const zip = new JSZip();
            const rootFolder = zip.folder(`Collection_${commonId}`);

            if (rootFolder) {
                for (const img of images) {
                    const serial = `SMJN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                    const assets = await generateShowcaseAssets(img, icons, serial);
                    const imgFolder = rootFolder.folder(`${img.pipeline || 'Default'}_${img.aspectRatio === '21:9' ? 'Wide' : 'Vert'}`);

                    if (imgFolder) {
                        // Add original
                        const originalBase64 = img.url.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
                        imgFolder.file(`Original.png`, originalBase64, { base64: true });

                        // Add assets
                        assets.forEach(asset => {
                            const assetBase64 = asset.url.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
                            imgFolder.file(`${asset.label.replace(/\s+/g, '_')}.png`, assetBase64, { base64: true });
                        });
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Collection_${commonId}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error(e);
            alert("Failed to download collection.");
        } finally {
            setCurrentStatus("");
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        const file = event.target.files?.[0];

        if (file) {
            fileReader.readAsText(file, "UTF-8");
            fileReader.onload = async (e) => {
                try {
                    const content = e.target?.result;
                    if (typeof content === 'string') {
                        const parsedData = JSON.parse(content) as GeneratedImage[];
                        if (Array.isArray(parsedData)) {
                            await saveAllImagesToDB(parsedData);
                            loadHistory();
                            alert(`Successfully imported ${parsedData.length} items.`);
                        }
                    }
                } catch (err) {
                    alert("Failed to parse backup file.");
                }
            };
        }
    };

    // --- STYLE VARIABLES ---
    const isLight = themeMode === 'light';
    // Check if we are in a temporary preview environment where Google Auth is blocked
    const isPreviewEnvironment = window.location.hostname.includes('usercontent.goog') || window.location.hostname.includes('webcontainer.io');

    const bgStyle = customBackground
        ? {
            backgroundImage: `url(${customBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }
        : {
            backgroundImage: isLight
                ? 'radial-gradient(at 0% 0%, hsla(210, 100%, 96%, 1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(280, 100%, 96%, 1) 0, transparent 50%)'
                : 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
            backgroundColor: isLight ? '#f8fafc' : '#000'
        };

    const overlayStyle = customBackground
        ? { backdropFilter: 'blur(30px) brightness(0.6)', backgroundColor: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }
        : {};

    const textColor = isLight && !customBackground ? 'text-slate-800' : 'text-slate-200';
    const headingColor = isLight && !customBackground ? 'text-slate-900' : 'text-white';
    const subTextColor = isLight && !customBackground ? 'text-slate-500' : 'text-white/50';

    // --- COMPONENT: IMAGE GRID ---
    const ImageGrid = ({ images, allowDelete = false }: { images: GeneratedImage[], allowDelete?: boolean }) => (
        <div className="space-y-12 animate-fadeIn">
            {/* Vertical Gallery */}
            {images.filter(img => img.aspectRatio === '9:16').length > 0 && (
                <div className="space-y-6">
                    <h3 className={`text-lg font-medium ${isLight && !customBackground ? 'text-slate-700' : 'text-white/80'}`}>Vertical (9:16)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {images.filter(img => img.aspectRatio === '9:16').map((img) => (
                            <div key={img.id} className={`group relative aspect-[9/16] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 ${isLight && !customBackground ? 'shadow-slate-200' : ''}`}>
                                <img src={img.url} alt="Generated" className="w-full h-full object-cover" />
                                {/* Badges */}
                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                    <div className="px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white/50 font-mono flex items-center gap-2">
                                        <span>PRO 4K</span>
                                        {allowDelete && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} className="hover:text-red-400">×</button>
                                        )}
                                    </div>
                                    {img.pipeline && (
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold border border-white/20 backdrop-blur-sm 
                                        ${img.pipeline === 'A' ? 'bg-indigo-500/40 text-indigo-100' :
                                                img.pipeline === 'B' ? 'bg-orange-500/40 text-orange-100' :
                                                    'bg-emerald-500/40 text-emerald-100'}`}>
                                            PIPE {img.pipeline}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveShowcaseImage(img); }}
                                        className="w-full py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-medium hover:bg-white/30 transition-colors"
                                    >
                                        Product Showcase
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCustomBackground(img.url); }}
                                        className="w-full py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-white/70 text-xs font-medium hover:bg-black/60 transition-colors"
                                    >
                                        Set as Background
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDownloadBundle(img); }}
                                        className="w-full py-2 bg-indigo-500/40 backdrop-blur-md border border-indigo-500/30 rounded-lg text-white/90 text-xs font-medium hover:bg-indigo-500/60 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Bundle
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cinematic Gallery */}
            {images.filter(img => img.aspectRatio === '21:9').length > 0 && (
                <div className="space-y-6">
                    <h3 className={`text-lg font-medium ${isLight && !customBackground ? 'text-slate-700' : 'text-white/80'}`}>Cinematic Widescreen (21:9)</h3>
                    <div className="grid grid-cols-1 gap-8">
                        {images.filter(img => img.aspectRatio === '21:9').map((img) => (
                            <div key={img.id} className="group relative aspect-[21/9] rounded-xl overflow-hidden shadow-2xl border border-white/5">
                                <img src={img.url} alt="Generated Wide" className="w-full h-full object-cover" />

                                {/* Badges */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {img.pipeline && (
                                        <div className={`px-3 py-1 rounded-md text-xs font-bold border border-white/20 backdrop-blur-sm 
                                        ${img.pipeline === 'A' ? 'bg-indigo-500/40 text-indigo-100' :
                                                img.pipeline === 'B' ? 'bg-orange-500/40 text-orange-100' :
                                                    'bg-emerald-500/40 text-emerald-100'}`}>
                                            PIPELINE {img.pipeline}
                                        </div>
                                    )}
                                    <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded text-xs text-white/70 font-mono flex items-center gap-2">
                                        <span>PRO 4K</span>
                                        {allowDelete && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }} className="hover:text-red-400 text-lg leading-none">×</button>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 gap-2">
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setCustomBackground(img.url); }}
                                            className="px-6 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-white/70 text-xs font-medium hover:bg-black/60 transition-colors"
                                        >
                                            Set as Background
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveShowcaseImage(img); }}
                                            className="px-8 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-medium hover:bg-white/30 transition-colors"
                                        >
                                            Product Showcase
                                        </button>
                                    </div>
                                    <div className="flex gap-3 justify-end mt-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownloadBundle(img); }}
                                            className="px-6 py-2 bg-indigo-500/40 backdrop-blur-md border border-indigo-500/30 rounded-lg text-white/90 text-xs font-medium hover:bg-indigo-500/60 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Download Bundle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 selection:bg-purple-500/30`} style={bgStyle}>
            <div className="min-h-screen w-full transition-all duration-500" style={overlayStyle}>

                {/* Header */}
                <header className={`sticky top-0 z-40 border-b ${isLight && !customBackground ? 'border-black/5 bg-white/70' : 'border-white/10 bg-black/50'} backdrop-blur-md transition-colors duration-300`}>
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 animate-pulse"></div>
                                <div>
                                    <h1 className={`text-xl font-bold tracking-tight ${headingColor}`}>Cinematic Vision Engine</h1>
                                    <div className={`text-xs font-mono tracking-widest ${subTextColor}`}>VER 2.1 // PBR OPTICAL SIM</div>
                                </div>
                            </div>

                            {/* View Navigation */}
                            <div className="flex items-center gap-1 bg-black/10 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('create')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'create' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setViewMode('gallery')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'gallery' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                                >
                                    Gallery ({historyImages.length})
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">

                            {/* Cloud Button */}
                            <button
                                onClick={() => setShowCloudModal(true)}
                                className={`p-2 rounded-lg border transition-colors relative ${isCloudAuthenticated ? 'text-green-400 border-green-400/30 bg-green-400/10' : (isLight && !customBackground ? 'border-black/10 text-black hover:bg-black/5' : 'border-white/10 text-white hover:bg-white/10')}`}
                                title="Cloud Settings"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                {isCloudAuthenticated && <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>}
                            </button>

                            <button
                                onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
                                className={`p-2 rounded-lg border transition-colors ${isLight && !customBackground ? 'border-black/10 hover:bg-black/5 text-black' : 'border-white/10 hover:bg-white/10 text-white'}`}
                                title="Toggle Theme"
                            >
                                {themeMode === 'dark' ? '☀️' : '🌙'}
                            </button>

                            {/* Reset Background */}
                            {customBackground && (
                                <button
                                    onClick={() => setCustomBackground(null)}
                                    className="text-[10px] uppercase font-mono text-red-400 hover:text-red-300 px-2"
                                >
                                    Reset BG
                                </button>
                            )}

                            {/* Model Selector */}
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className={`border rounded-lg px-4 py-2 text-sm focus:outline-none ${isLight && !customBackground ? 'bg-white/50 border-black/10 text-black' : 'bg-white/5 border-white/10 text-white'}`}
                            >
                                {AI_MODELS.map(m => (
                                    <option key={m.id} value={m.id} className="bg-black text-white">{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">

                    {/* VIEW: CREATE */}
                    {viewMode === 'create' && (
                        <section className="space-y-8 animate-fadeIn">
                            {/* 1. IP Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-sm uppercase tracking-widest font-semibold ${subTextColor}`}>Step 1: Select Source Material</h3>
                                    <button
                                        onClick={handleCustomModeToggle}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${useCustomInput
                                            ? 'bg-purple-500 text-white border-purple-400 shadow-lg'
                                            : (isLight && !customBackground ? 'bg-white/60 border-black/10 text-slate-600 hover:bg-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10')
                                            }`}
                                    >
                                        {useCustomInput ? '✓ Custom Mode' : '+ Custom Input'}
                                    </button>
                                </div>

                                {useCustomInput ? (
                                    <div className="space-y-4">
                                        <GlassCard className={`p-6 ${isLight && !customBackground ? '!bg-white/60 !border-black/5' : ''}`}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${subTextColor}`}>
                                                        IP / Source Material Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customIPName}
                                                        onChange={(e) => setCustomIPName(e.target.value)}
                                                        placeholder="e.g., Attack on Titan, Cyberpunk 2077..."
                                                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${isLight && !customBackground
                                                            ? 'bg-white border-black/10 text-slate-900 placeholder-slate-400'
                                                            : 'bg-white/5 border-white/10 text-white placeholder-white/30'
                                                            }`}
                                                    />
                                                </div>
                                                <div className={`text-xs ${isLight && !customBackground ? 'text-slate-500' : 'text-white/40'}`}>
                                                    💡 Enter the name of any anime, game, movie, or fictional universe
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {IP_DATABASE.map(ip => (
                                            <GlassCard
                                                key={ip.id}
                                                onClick={() => handleIPSelect(ip)}
                                                isActive={selectedIP?.id === ip.id}
                                                className={`p-4 cursor-pointer flex flex-col items-center text-center gap-2 group ${isLight && !customBackground && !selectedIP ? '!bg-white/60 !border-black/5 hover:!bg-white' : ''}`}
                                            >
                                                <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                                                    {ip.id === 'naruto' ? '🦊' :
                                                        ip.id === 'digimon' ? '🦖' :
                                                            ip.id === 'lets_go' ? '🏎️' :
                                                                ip.id === 'dragon_ball' ? '🐉' :
                                                                    ip.id === 'one_piece' ? '🏴‍☠️' : '📽️'}
                                                </span>
                                                <span className={`text-xs font-medium ${isLight && !customBackground && selectedIP?.id !== ip.id ? 'text-slate-600' : 'text-white/80'}`}>{ip.name}</span>
                                            </GlassCard>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. Character Selection */}
                            {(selectedIP || (useCustomInput && customIPName.trim())) && (
                                <div className="space-y-4 animate-fadeIn">
                                    <h3 className={`text-sm uppercase tracking-widest font-semibold ${subTextColor}`}>Step 2: Select Subject</h3>

                                    {useCustomInput ? (
                                        <GlassCard className={`p-6 ${isLight && !customBackground ? '!bg-white/60 !border-black/5' : ''}`}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${subTextColor}`}>
                                                        Character / Subject Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customCharName}
                                                        onChange={(e) => setCustomCharName(e.target.value)}
                                                        placeholder="e.g., Eren Yeager, V, Geralt..."
                                                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${isLight && !customBackground
                                                            ? 'bg-white border-black/10 text-slate-900 placeholder-slate-400'
                                                            : 'bg-white/5 border-white/10 text-white placeholder-white/30'
                                                            }`}
                                                    />
                                                </div>
                                                <div className={`text-xs ${isLight && !customBackground ? 'text-slate-500' : 'text-white/40'}`}>
                                                    💡 Enter the name of any character, person, or subject from your chosen IP
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 custom-scrollbar">
                                            {selectedIP?.characters.map(char => (
                                                <button
                                                    key={char.id}
                                                    onClick={() => handleCharSelect(char)}
                                                    className={`
                                                px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 text-left truncate
                                                ${selectedChar?.id === char.id
                                                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                                            : (isLight && !customBackground ? 'bg-white/40 border-black/5 hover:bg-white text-slate-700' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80')
                                                        }
                                            `}
                                                >
                                                    {char.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. Pipeline Selection */}
                            {(selectedChar || (useCustomInput && customCharName.trim())) && (
                                <div className="space-y-4 animate-fadeIn">
                                    <h3 className={`text-sm uppercase tracking-widest font-semibold ${subTextColor}`}>Step 3: Rendering Pipeline</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {PIPELINES.map(pipeline => (
                                            <GlassCard
                                                key={pipeline.id}
                                                onClick={() => setSelectedPipeline(pipeline.id as PipelineType)}
                                                isActive={selectedPipeline === pipeline.id}
                                                className={`p-6 cursor-pointer text-left group ${isLight && !customBackground && selectedPipeline !== pipeline.id ? '!bg-white/60 !border-black/5 hover:!bg-white' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg
                                                ${selectedPipeline === pipeline.id ? 'bg-black text-white' : (isLight && !customBackground ? 'bg-slate-200 text-slate-500' : 'bg-white/10 text-white/60')}
                                            `}>
                                                        {pipeline.id}
                                                    </div>
                                                    {selectedPipeline === pipeline.id && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"></div>}
                                                </div>
                                                <h4 className={`text-lg font-semibold mb-1 ${isLight && !customBackground && selectedPipeline !== pipeline.id ? 'text-slate-800' : 'text-white'}`}>{pipeline.name}</h4>
                                                <p className={`text-xs leading-relaxed ${isLight && !customBackground && selectedPipeline !== pipeline.id ? 'text-slate-500' : 'text-white/50'}`}>{pipeline.description}</p>
                                            </GlassCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Generate Actions */}
                            {(selectedChar || (useCustomInput && customCharName.trim())) && (
                                <div className="flex flex-col items-center gap-4 py-8">

                                    {/* BATCH RENDER BUTTON (ALL) */}
                                    <button
                                        onClick={() => handleGenerate('ALL')}
                                        disabled={isGenerating}
                                        className={`
                                    w-full md:w-auto relative px-12 py-5 rounded-2xl font-bold text-lg tracking-wide transition-all duration-500 overflow-hidden group
                                    ${isGenerating
                                                ? 'cursor-not-allowed opacity-50'
                                                : currentStatus.includes('ERROR')
                                                    ? 'bg-red-500/20 border border-red-500 hover:bg-red-500/30'
                                                    : 'hover:scale-[1.02]'}
                                `}
                                    >
                                        <div className={`absolute inset-0 transition-opacity ${currentStatus.includes('ERROR') ? 'bg-red-900/50' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100'}`}></div>
                                        {!currentStatus.includes('ERROR') && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>}

                                        <span className="relative z-10 flex flex-col items-center gap-1 text-white drop-shadow-md">
                                            <span className="flex items-center gap-3">
                                                {isGenerating ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {currentStatus}
                                                    </>
                                                ) : (
                                                    currentStatus.includes('ERROR') ? currentStatus : "BATCH RENDER ALL VARIATIONS"
                                                )}
                                            </span>
                                            {!isGenerating && <span className="text-[10px] font-mono opacity-80 uppercase">Generates 6 Images (Pipelines A, B, & C)</span>}
                                        </span>
                                    </button>

                                    {/* SINGLE PIPELINE BUTTON */}
                                    {selectedPipeline && !isGenerating && (
                                        <button
                                            onClick={() => handleGenerate('SINGLE')}
                                            disabled={isGenerating}
                                            className={`
                                        px-8 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 border
                                        ${isLight && !customBackground
                                                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                                    `}
                                        >
                                            Render Only Pipeline {selectedPipeline} (2 Images)
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* SESSION RESULTS */}
                            {currentSessionImages.length > 0 && (
                                <div className="pt-8 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className={`text-2xl font-light ${headingColor}`}>Session Output</h3>
                                        <div className="flex gap-4 items-center">
                                            {currentSessionImages.length > 0 && currentSessionImages[0].commonId && (
                                                <button
                                                    onClick={() => handleDownloadAllBundles(currentSessionImages[0].commonId!)}
                                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg transition-colors flex items-center gap-2"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    DOWNLOAD ALL VARIANTS
                                                </button>
                                            )}
                                            <span className="text-xs text-green-400 font-mono tracking-wider">RENDER COMPLETE</span>
                                        </div>
                                    </div>

                                    {Object.keys(generatedPrompts).length > 0 && (
                                        <div className="max-w-4xl mx-auto mb-8 space-y-4">
                                            {Object.entries(generatedPrompts).sort().map(([pipeline, prompt]) => (
                                                <GlassCard key={pipeline} className={`p-6 relative group ${isLight && !customBackground ? '!bg-white/60 !border-black/5' : ''}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className={`text-xs uppercase font-mono ${subTextColor}`}>
                                                            Pipeline {pipeline} Prompt
                                                        </h4>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(prompt as string);
                                                                // Optional: Add visual feedback
                                                            }}
                                                            className={`
                                                                text-[10px] uppercase font-bold px-3 py-1 rounded border transition-all
                                                                ${isLight && !customBackground
                                                                    ? 'border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                                                                    : 'border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                                                            `}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <p className="font-mono text-xs text-green-400/80 leading-relaxed break-words">
                                                        {prompt}
                                                    </p>
                                                </GlassCard>
                                            ))}
                                        </div>
                                    )}

                                    <ImageGrid images={currentSessionImages} />
                                </div>
                            )}
                        </section>
                    )}

                    {/* VIEW: GALLERY */}
                    {viewMode === 'gallery' && (
                        <section className="space-y-8 animate-fadeIn">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <div className="flex flex-col">
                                    <h3 className={`text-2xl font-light ${headingColor}`}>Archives</h3>
                                    <span className={`text-xs mt-1 ${subTextColor}`}>Local Database Storage</span>
                                </div>
                                <div className="flex flex-wrap gap-4 items-center">

                                    {/* Upload Progress */}
                                    {uploadProgress && (
                                        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
                                            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs text-indigo-400 font-mono">
                                                UPLOADING {uploadProgress.current}/{uploadProgress.total}
                                            </span>
                                        </div>
                                    )}

                                    {zipProgress !== null && (
                                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
                                            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs text-yellow-400 font-mono">
                                                ZIPPING {Math.round(zipProgress)}%
                                            </span>
                                        </div>
                                    )}

                                    {/* EXPORT BUTTONS */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleZipExport}
                                            className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded shadow-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            EXPORT ZIP
                                        </button>

                                        {isCloudAuthenticated && (
                                            <button
                                                onClick={handleExportImagesToDrive}
                                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                SYNC TO DRIVE
                                            </button>
                                        )}
                                    </div>

                                    <div className="h-6 w-px bg-white/10 mx-2"></div>

                                    <div className="flex gap-2">
                                        <button onClick={handleExportData} className={`text-[10px] uppercase font-mono transition-colors border px-2 py-1 rounded ${isLight && !customBackground ? 'border-black/10 text-slate-500 hover:text-black' : 'border-white/10 text-white/40 hover:text-white'}`}>
                                            Backup JSON
                                        </button>
                                        <button onClick={() => fileInputRef.current?.click()} className={`text-[10px] uppercase font-mono transition-colors border px-2 py-1 rounded ${isLight && !customBackground ? 'border-black/10 text-slate-500 hover:text-black' : 'border-white/10 text-white/40 hover:text-white'}`}>
                                            Restore JSON
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                                    </div>
                                    <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-900/30 px-3 py-1 rounded">CLEAR HISTORY</button>
                                </div>
                            </div>

                            {historyImages.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <p>No archives found.</p>
                                </div>
                            ) : (
                                <ImageGrid images={historyImages} allowDelete={true} />
                            )}
                        </section>
                    )}

                </main>

                {/* Footer */}
                <footer className={`py-8 text-center text-xs font-mono ${subTextColor}`}>
                    <p>POWERED BY GEMINI VISION & DOTEY LOGIC STRUCTURE</p>
                </footer>

                {/* Showcase Modal */}
                {activeShowcaseImage && (
                    <ShowcaseGenerator
                        image={activeShowcaseImage}
                        onClose={() => setActiveShowcaseImage(null)}
                    />
                )}

                {/* Cloud Config Modal */}
                {showCloudModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                            <button onClick={() => setShowCloudModal(false)} className="absolute top-4 right-4 text-white/30 hover:text-white">✕</button>

                            <h3 className="text-xl font-light text-white mb-6">Cloud Configuration</h3>

                            <div className="space-y-4">
                                {isPreviewEnvironment && (
                                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                                        <strong className="block text-red-100 mb-2 text-sm">⛔ ACCESS BLOCKED BY GOOGLE</strong>
                                        <p className="mb-2">
                                            You are using a temporary preview URL (<code>*.usercontent.goog</code>).
                                            Google's strict security policies <strong>DO NOT allow</strong> these URLs to use Drive API.
                                        </p>
                                        <p className="mb-3">
                                            You will receive a <code>400: invalid_request</code> error if you try to connect.
                                        </p>
                                        <div className="bg-red-500/20 p-2 rounded text-center">
                                            <strong className="text-white block mb-1">SOLUTION:</strong>
                                            Use the <strong>EXPORT ZIP</strong> button in the Gallery. <br />
                                            It requires NO setup and works instantly.
                                        </div>
                                    </div>
                                )}

                                {!isPreviewEnvironment && (
                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 mb-4">
                                        <strong className="block text-blue-100 mb-1">OAUTH CONFIGURATION CHECK</strong>
                                        <p className="mb-1">Your current origin is: <code className="bg-black/30 px-1 rounded text-white">{window.location.origin}</code></p>
                                        <p>Ensure this EXACT URL is added to <strong>Authorized JavaScript origins</strong> in your Google Cloud Console.</p>
                                    </div>
                                )}

                                <div className={isPreviewEnvironment ? "opacity-50 pointer-events-none filter blur-[1px]" : ""}>
                                    {/* Disabled content to emphasize the warning above */}
                                    <label className="text-xs text-white/50 font-mono block mb-2">GOOGLE CLIENT ID (Advanced Users Only)</label>
                                    <input
                                        type="text"
                                        disabled={isPreviewEnvironment}
                                        placeholder={isPreviewEnvironment ? "Feature disabled in preview mode" : "Enter your Google Cloud Client ID"}
                                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
                                        value={googleClientId}
                                        onChange={(e) => setGoogleClientId(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/10 flex gap-3">
                                    {!isPreviewEnvironment && (
                                        <button
                                            onClick={initDrive}
                                            disabled={!googleClientId}
                                            className={`flex-1 py-3 rounded-lg font-bold text-sm tracking-wide transition-transform ${!googleClientId ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.02]'}`}
                                        >
                                            {isCloudAuthenticated ? 'RE-CONNECT' : 'CONNECT DRIVE'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowCloudModal(false)}
                                        className={`py-3 bg-white text-black rounded-lg font-bold text-sm tracking-wide hover:scale-[1.02] transition-transform ${isPreviewEnvironment ? 'w-full' : 'flex-1'}`}
                                    >
                                        {isPreviewEnvironment ? "GOT IT, I'LL USE ZIP EXPORT" : "CLOSE"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global CSS for animations */}
                <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
                animation: fadeIn 0.6s ease-out forwards;
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.02);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
            }
        `}</style>
            </div>
        </div>
    );
};

export default App;