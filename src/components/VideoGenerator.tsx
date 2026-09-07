import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Download,
  Maximize2,
  RefreshCw,
  UploadCloud,
  X,
  Sliders,
  Ratio,
  Compass,
  AlertCircle,
  Film,
  Check,
  Copy,
  Cpu,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  VideoAspectRatio,
  VideoResolution,
  GeneratedItem,
  CameraPreset,
  AIProviderConfig,
} from '../types';
import { CAMERA_PRESETS, SAMPLE_PROMPTS } from '../data/presets';
import { PROVIDERS_META } from '../data/providers';
import { fileToBase64, downloadMedia } from '../utils/file';

interface VideoGeneratorProps {
  onVideoGenerated: (item: GeneratedItem) => void;
  onOpenLightbox: (item: GeneratedItem) => void;
  incomingImage: { url: string; prompt: string } | null;
  onClearIncomingImage: () => void;
  providerConfig: AIProviderConfig;
  onOpenSettings: () => void;
}

const REASSURING_MESSAGES = [
  'Initialisation du réseau neuronal Veo 3.1...',
  'Analyse des coordonnées spatiales et de la trajectoire visuelle...',
  'Calcul de la dynamique des fluides, de la lumière et du mouvement...',
  'Synthèse haute fidélité des images clés...',
  'Affinement photoréaliste et cohérence temporelle...',
  'Encodage et finalisation du flux vidéo MP4...',
];

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  onVideoGenerated,
  onOpenLightbox,
  incomingImage,
  onClearIncomingImage,
  providerConfig,
  onOpenSettings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [model, setModel] = useState<'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview'>(
    'veo-3.1-lite-generate-preview'
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>(CAMERA_PRESETS[0]);

  // Image source (Image-to-Video)
  const [startImage, setStartImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  // Ending Image (Start/End Frame transition)
  const [endImage, setEndImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Result state
  const [latestItem, setLatestItem] = useState<GeneratedItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Video playback
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startFileInputRef = useRef<HTMLInputElement>(null);

  // If an image arrives from the Image Generator
  useEffect(() => {
    if (incomingImage) {
      const matches = incomingImage.url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        setStartImage({
          mimeType: matches[1],
          data: matches[2],
          previewUrl: incomingImage.url,
        });
      }
      if (incomingImage.prompt && !prompt) {
        setPrompt(incomingImage.prompt);
      }
      onClearIncomingImage();
    }
  }, [incomingImage, onClearIncomingImage, prompt]);

  // Timer & progress updates
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setElapsedSeconds(0);
      setCurrentStepIndex(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          const nextIndex = Math.min(
            Math.floor(next / 14),
            REASSURING_MESSAGES.length - 1
          );
          setCurrentStepIndex(nextIndex);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleFileUpload = async (file: File, isEnd = false) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide.');
      return;
    }
    try {
      const { data, mimeType } = await fileToBase64(file);
      const imgObj = {
        data,
        mimeType,
        previewUrl: URL.createObjectURL(file),
      };
      if (isEnd) {
        setEndImage(imgObj);
      } else {
        setStartImage(imgObj);
      }
      setErrorMessage(null);
    } catch {
      setErrorMessage("Impossible de lire l'image.");
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mediaType: 'video', providerConfig }),
      });
      const data = await res.json();
      if (res.ok && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      } else {
        setErrorMessage(data.error || "Impossible d'optimiser le prompt vidéo.");
      }
    } catch {
      setErrorMessage("Erreur réseau lors de l'optimisation.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const pollVideoOperation = async (operationName: string): Promise<string> => {
    while (true) {
      await new Promise((r) => setTimeout(r, 5000));

      const statusRes = await fetch('/api/video-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName, providerConfig }),
      });

      const statusData = await statusRes.json();
      if (!statusRes.ok || statusData.error) {
        throw new Error(statusData.error || 'Erreur lors de la génération vidéo.');
      }

      if (statusData.done) {
        const downloadRes = await fetch('/api/video-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName, providerConfig }),
        });

        if (!downloadRes.ok) {
          const errBody = await downloadRes.json().catch(() => ({}));
          throw new Error(errBody.error || 'Impossible de télécharger la vidéo générée.');
        }

        const videoBlob = await downloadRes.blob();
        return URL.createObjectURL(videoBlob);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !startImage) {
      setErrorMessage('Veuillez renseigner une description ou charger une image de départ.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    let finalPrompt = prompt.trim();
    if (cameraPreset.promptInstruction) {
      finalPrompt = finalPrompt
        ? `${finalPrompt}, ${cameraPreset.promptInstruction}`
        : cameraPreset.promptInstruction;
    }

    try {
      const initRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
          resolution,
          model,
          inputImage: startImage
            ? { data: startImage.data, mimeType: startImage.mimeType }
            : undefined,
          lastFrame: endImage
            ? { data: endImage.data, mimeType: endImage.mimeType }
            : undefined,
          providerConfig,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.operationName) {
        throw new Error(initData.error || 'Impossible de lancer la génération vidéo.');
      }

      const videoBlobUrl = await pollVideoOperation(initData.operationName);

      const newItem: GeneratedItem = {
        id: 'vid_' + Date.now(),
        type: 'video',
        prompt: finalPrompt,
        originalPrompt: prompt,
        aspectRatio,
        resolution,
        model,
        createdAt: Date.now(),
        url: videoBlobUrl,
        cameraMovement: cameraPreset.name,
      };

      setLatestItem(newItem);
      onVideoGenerated(newItem);
    } catch (err: any) {
      console.error('Erreur vidéo:', err);
      setErrorMessage(
        err.message || 'La génération de la vidéo a échoué. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!latestItem) return;
    navigator.clipboard.writeText(latestItem.originalPrompt || latestItem.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Configuration Panel */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Prompt Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scénario & Dynamique de la Vidéo</span>
              </label>

              <button
                type="button"
                disabled={isEnhancing || !prompt.trim()}
                onClick={handleEnhancePrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{isEnhancing ? 'Optimisation...' : '✨ Optimiser la scène'}</span>
              </button>
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ex: Une caméra se déplace en travelling lent à travers un sanctuaire illuminé de lanternes sous une pluie fine, reflets d&apos;eau sur les pierres...'
                rows={4}
                className="w-full border border-slate-300 rounded-xl p-4 pr-10 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white placeholder-slate-400 transition-all"
              />
              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Chips */}
            <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Suggestions:
              </span>
              {SAMPLE_PROMPTS.filter((p) => p.type === 'video').map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample.prompt)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md text-slate-600 font-medium border border-slate-200 transition-colors truncate max-w-[280px]"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Presets */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mouvement de Caméra Cinématographique</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CAMERA_PRESETS.map((preset) => {
                const isSelected = cameraPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCameraPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Aspect Ratio & Resolution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            {/* Format Ratio */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                <Ratio className="w-3.5 h-3.5 text-indigo-600" />
                <span>Format Vidéo</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    aspectRatio === '16:9'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-3 border-2 rounded-xs ${aspectRatio === '16:9' ? 'border-indigo-600' : 'border-slate-400'}`} />
                  <span>16:9 Paysage</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    aspectRatio === '9:16'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-3 h-5 border-2 rounded-xs ${aspectRatio === '9:16' ? 'border-indigo-600' : 'border-slate-400'}`} />
                  <span>9:16 Portrait</span>
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Définition Vidéo</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    resolution === '720p'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  720p (Rapide)
                </button>

                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                    resolution === '1080p'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  1080p (Full HD)
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Moteur :
                  <span className="font-mono font-semibold text-indigo-700 ml-1">Google Veo 3.1</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Paramètres IA
                </button>
              </div>
            </div>
          </div>

          {/* Image-to-Video Source */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Image source pour animation (Image-vers-Vidéo)</span>
              </label>
              {startImage && (
                <button
                  type="button"
                  onClick={() => setStartImage(null)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Retirer
                </button>
              )}
            </div>

            {startImage ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={startImage.previewUrl}
                  alt="Image de départ"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-300"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Image de départ liée</p>
                  <p className="text-[11px] text-slate-500">
                    Veo 3.1 donnera vie à cette image selon votre prompt scénarisé.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStartImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => startFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0], false);
                }}
                className="border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-3 text-center cursor-pointer transition-colors"
              >
                <p className="text-xs text-slate-500">
                  Glissez une image ou <span className="text-indigo-600 font-semibold underline">cliquez ici</span> pour animer une image fixe en vidéo
                </p>
                <input
                  ref={startFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-bold">Information de génération</p>
                  <p className="text-rose-600/90 leading-relaxed mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="self-end sm:self-auto shrink-0 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors cursor-pointer"
              >
                Paramètres API
              </button>
            </div>
          )}

          {/* Main Generate Button */}
          <button
            type="button"
            disabled={isLoading || (!prompt.trim() && !startImage)}
            onClick={handleGenerate}
            className="w-full bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Génération vidéo en cours ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-indigo-200" />
                <span>Générer la vidéo avec Veo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Video Render & Monitor Panel */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Lecteur & Rendu Vidéo
            </h3>
            {latestItem && (
              <span className="text-[11px] font-mono font-medium text-slate-500">
                {latestItem.aspectRatio} • {latestItem.resolution}
              </span>
            )}
          </div>

          {/* Central Area */}
          <div className="my-auto py-4 flex items-center justify-center">
            {isLoading ? (
              <div className="w-full flex flex-col items-center justify-center py-6 text-center space-y-4">
                {/* Progress Wheel */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <Film className="w-6 h-6 text-indigo-600" />
                    <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">{elapsedSeconds}s</span>
                  </div>
                </div>

                <div className="space-y-1 max-w-sm px-2">
                  <p className="text-sm font-bold text-slate-800">
                    {REASSURING_MESSAGES[currentStepIndex]}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Veo synthétise la cohérence temporelle et le rendu cinématique.
                  </p>
                </div>

                {/* Steps tracker */}
                <div className="w-full max-w-xs bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-left">
                  {REASSURING_MESSAGES.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-[11px] transition-colors ${
                        idx === currentStepIndex
                          ? 'text-indigo-700 font-bold'
                          : idx < currentStepIndex
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          idx === currentStepIndex
                            ? 'bg-indigo-600 animate-ping'
                            : idx < currentStepIndex
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span className="truncate">{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : latestItem ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-3"
              >
                <div className="relative group w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center shadow-md max-h-[420px]">
                  <video
                    ref={videoRef}
                    src={latestItem.url}
                    loop
                    playsInline
                    controls
                    className="w-full h-auto max-h-[420px] object-contain rounded-xl"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>

                <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                  <span className="truncate max-w-[280px] font-medium text-slate-700">
                    {latestItem.originalPrompt || latestItem.prompt}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="aspect-video w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-300 flex flex-col items-center justify-center opacity-70 border-dashed p-6 text-center space-y-2">
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Aperçu en attente</p>
                <p className="text-xs font-medium text-slate-500 max-w-xs">
                  Les vidéos cinématographiques générées avec Google Veo apparaîtront directement dans ce lecteur interactif.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {latestItem && (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadMedia(latestItem.url, `studio-video-${latestItem.id}.mp4`)}
                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Télécharger MP4</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLightbox(latestItem)}
                className="py-2.5 px-3 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                title="Plein écran"
              >
                <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Plein écran</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
