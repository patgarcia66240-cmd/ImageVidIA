export type MediaType = 'image' | 'video';

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type VideoAspectRatio = '16:9' | '9:16';

export type ImageResolution = '512px' | '1K' | '2K';
export type VideoResolution = '720p' | '1080p';

export interface StylePreset {
  id: string;
  name: string;
  category: string;
  promptSuffix: string;
  previewGradient: string;
  iconName?: string;
}

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  promptInstruction: string;
}

export interface GeneratedItem {
  id: string;
  type: MediaType;
  prompt: string;
  originalPrompt?: string;
  aspectRatio: string;
  resolution?: string;
  model: string;
  createdAt: number;
  url: string; // Base64 data URL for image, or blob/object URL for video
  thumbnailUrl?: string;
  operationName?: string;
  styleName?: string;
  cameraMovement?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio: ImageAspectRatio;
  imageSize?: ImageResolution;
  model?: 'gemini-3.1-flash-image' | 'gemini-3.1-flash-lite-image';
  inputImage?: {
    data: string; // base64 without header
    mimeType: string;
  };
}

export interface VideoGenerationRequest {
  prompt: string;
  model?: 'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview';
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
  inputImage?: {
    data: string;
    mimeType: string;
  };
  lastFrame?: {
    data: string;
    mimeType: string;
  };
}

export interface VideoPollingStatus {
  done: boolean;
  error?: string | null;
}

export type AIProviderId = 'gemini' | 'openai' | 'qwen' | 'custom';

export interface ProviderItemSettings {
  apiKey: string;
  baseUrl?: string;
  imageModel: string;
  videoModel?: string;
  enhancerModel: string;
  customKeyEnabled?: boolean;
}

export interface AIProviderConfig {
  activeProvider: AIProviderId;
  providers: Record<AIProviderId, ProviderItemSettings>;
}
