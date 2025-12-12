
export interface IPData {
  id: string;
  name: string;
  characters: Character[];
}

export interface Character {
  id: string;
  name: string;
  defaultPipeline?: PipelineType;
}

export type PipelineType = 'A' | 'B' | 'C';

export interface PipelineConfig {
  id: PipelineType;
  name: string;
  description: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  aspectRatio: string; // '9:16' | '21:9' (simulated via 16:9) | '3:4'
  prompt: string;
  timestamp: number;
  model: string;
  pipeline?: PipelineType;
  commonId?: string;
  metadata?: {
    charName?: string;
    ipName?: string;
    themeColor?: string;
    entityName?: string; // For specific object names if different from charName
  };
}

export interface ShowcaseConfig {
  baseImage: GeneratedImage;
  device: 'iPhone' | 'iPad' | 'MacBook' | 'Monitor';
  watermark: string;
  serialNumber: string;
}
