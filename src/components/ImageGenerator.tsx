import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Download,
  Maximize2,
  Video,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  X,
  Sliders,
  Ratio,
  Layers,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ImageAspectRatio,
  ImageResolution,
  GeneratedItem,
  StylePreset,
  AIProviderConfig,
} from '../types';
import { IMAGE_STYLE_PRESETS, SAMPLE_PROMPTS } from '../data/presets';
import { PROVIDERS_META } from '../data/providers';
import { fileToBase64, downloadMedia } from '../utils/file';

interface ImageGeneratorProps {
  onImageGenerated: (item: GeneratedItem) => void;
  onTransferToVideo: (imageUrl: string, prompt: string) => void;
  onOpenLightbox: (item: GeneratedItem) => void;
  providerConfig: AIProviderConfig;
  onUpdateProviderConfig?: (config: AIProviderConfig) => void;
  onOpenSettings: () => void;
}

const ASPECT_RATIOS: { label: string; value: ImageAspectRatio; iconClass: string }[] = [
  { label: '1:1', value: '1:1', iconClass: 'w-4 h-4' },
  { label: '16:9', value: '16:9', iconClass: 'w-6 h-3.5' },
  { label: '9:16', value: '9:16', iconClass: 'w-3.5 h-6' },
  { label: '4:3', value: '4:3', iconClass: 'w-5 h-4' },
  { label: '3:4', value: '3:4', iconClass: 'w-4 h-5' },
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onImageGenerated,
  onTransferToVideo,
  onOpenLightbox,
  providerConfig,
  onUpdateProviderConfig,
  onOpenSettings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(IMAGE_STYLE_PRESETS[0]);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageResolution>('1K');

  // Image reference for Image-to-Image / Editing
  const [referenceImage, setReferenceImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Latest generated result
  const [latestItem, setLatestItem] = useState<GeneratedItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProvider = providerConfig?.activeProvider || 'gemini';
  const activeMeta = PROVIDERS_META[activeProvider] || PROVIDERS_META.gemini;
  const currentProviderSettings = providerConfig?.providers?.[activeProvider] || {};
  const currentImageModel =
    currentProviderSettings.imageModel ||
    (activeProvider === 'openai'
      ? 'gpt-image-3'
      : activeProvider === 'qwen'
      ? 'black-forest-labs/flux-1-schnell'
      : 'gemini-3.1-flash-image');

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide (PNG, JPEG, WebP).');
      return;
    }
    try {
      const { data, mimeType } = await fileToBase64(file);
      setReferenceImage({
        data,
        mimeType,
        previewUrl: URL.createObjectURL(file),
      });
      setErrorMessage(null);
    } catch {
      setErrorMessage("Impossible de lire l'image sélectionnée.");
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
        body: JSON.stringify({ prompt, mediaType: 'image', providerConfig }),
      });
      const data = await res.json();
      if (res.ok && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      } else {
        setErrorMessage(data.error || "Impossible d'optimiser le prompt.");
      }
    } catch {
      setErrorMessage("Erreur réseau lors de l'optimisation.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) {
      setErrorMessage('Veuillez saisir un prompt ou charger une image de référence.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const finalPrompt = selectedStyle
      ? `${prompt.trim()}${selectedStyle.promptSuffix}`
      : prompt.trim();

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
          imageSize,
          model: currentImageModel,
          inputImage: referenceImage
            ? { data: referenceImage.data, mimeType: referenceImage.mimeType }
            : undefined,
          providerConfig,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la génération de l'image.");
      }

      const newItem: GeneratedItem = {
        id: 'img_' + Date.now(),
        type: 'image',
        prompt: finalPrompt,
        originalPrompt: prompt,
        aspectRatio,
        resolution: imageSize,
        model: currentImageModel,
        createdAt: Date.now(),
        url: data.imageUrl,
        styleName: selectedStyle?.name,
      };

      setLatestItem(newItem);
      onImageGenerated(newItem);
    } catch (err: any) {
      console.error('Erreur génération image:', err);
      setErrorMessage(
        err.message || 'La génération a échoué. Veuillez vérifier votre clé API ou vos paramètres.'
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
      {/* Configuration Panel (Left) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Prompt Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Description visuelle (Prompt)</span>
              </label>

              <button
                type="button"
                disabled={isEnhancing || !prompt.trim()}
                onClick={handleEnhancePrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={`Améliorer le prompt avec ${activeProvider === 'openai' ? 'OpenAI GPT-4o' : activeMeta.name.split(' (')[0]}`}
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{isEnhancing ? 'Optimisation...' : '✨ Optimiser'}</span>
              </button>
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ex: Un palais de cristal niché au sommet d&apos;une montagne glacée sous une aurore boréale céleste, ultra-détaillé, 8k...'
                rows={4}
                className="w-full border border-slate-300 rounded-xl p-4 pr-10 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white placeholder-slate-400 transition-all"
              />
              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Effacer le texte"
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
              {SAMPLE_PROMPTS.filter((p) => p.type === 'image').map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample.prompt)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md text-slate-600 font-medium border border-slate-200 transition-colors truncate max-w-[240px]"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Artistic Style Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Style Artistique</span>
              </label>
              {selectedStyle && (
                <button
                  type="button"
                  onClick={() => setSelectedStyle(null)}
                  className="text-xs text-slate-400 hover:text-indigo-600 font-medium"
                >
                  Désactiver le style
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {IMAGE_STYLE_PRESETS.map((style) => {
                const isSelected = selectedStyle?.id === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(isSelected ? null : style)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-full rounded-full bg-gradient-to-r ${style.previewGradient} mb-2`}
                    />
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {style.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 truncate">{style.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio & Resolution Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                <Ratio className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ratio d'Aspect</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((item) => {
                  const isSelected = aspectRatio === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAspectRatio(item.value)}
                      className={`py-2.5 px-2 rounded-lg text-xs font-medium border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`border-2 rounded-xs mb-0.5 ${
                          isSelected ? 'border-indigo-600' : 'border-slate-400'
                        } ${item.iconClass}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution & AI Engine */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Définition & Moteur</span>
              </label>
              <div className="flex items-center gap-2 mb-2">
                {(['512px', '1K', '2K'] as ImageResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setImageSize(res)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      imageSize === res
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {res} {res === '1K' ? '(Standard)' : res === '2K' ? '(Ultra)' : '(Draft)'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fournisseur actif :</span>
                  <span className="font-bold text-slate-800">{activeMeta.name.split(' (')[0]}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={currentImageModel}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      if (onUpdateProviderConfig && providerConfig) {
                        onUpdateProviderConfig({
                          ...providerConfig,
                          providers: {
                            ...providerConfig.providers,
                            [activeProvider]: {
                              ...providerConfig.providers[activeProvider],
                              imageModel: newModel,
                            },
                          },
                        });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-800 font-medium text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {activeMeta.imageModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                    {!activeMeta.imageModels.some((m) => m.id === currentImageModel) && (
                      <option value={currentImageModel}>
                        {currentImageModel} (Personnalisé)
                      </option>
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    title="Gérer les clés d'API et modèles"
                  >
                    Paramètres
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Image (Image-to-Image Editing) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Image source pour retouche (Optionnel)</span>
              </label>
              {referenceImage && (
                <button
                  type="button"
                  onClick={() => setReferenceImage(null)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Retirer
                </button>
              )}
            </div>

            {referenceImage ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={referenceImage.previewUrl}
                  alt="Référence"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">Image source liée</p>
                  <p className="text-[11px] text-slate-500">
                    Le modèle générera une variation ou appliquera vos retouches textuelles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReferenceImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-3 text-center cursor-pointer transition-colors"
              >
                <p className="text-xs text-slate-500">
                  Glissez une image ici ou <span className="text-indigo-600 font-semibold underline">parcourez vos fichiers</span> pour transformer une image
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
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

          {/* Generate Button - Professional Polish Hero CTA */}
          <button
            type="button"
            disabled={isLoading || (!prompt.trim() && !referenceImage)}
            onClick={handleGenerate}
            className="w-full bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Génération de l'image en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Générer l'image</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Panel (Right) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Aperçu en Direct
            </h3>
            {latestItem && (
              <span className="text-[11px] font-mono font-medium text-slate-500">
                {latestItem.aspectRatio} • {latestItem.resolution}
              </span>
            )}
          </div>

          {/* Center Image Container */}
          <div className="my-auto py-4 flex items-center justify-center">
            {isLoading ? (
              <div className="w-full flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-md">
                  <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    Synthèse visuelle avec {activeProvider === 'openai' ? 'OpenAI' : activeMeta.name.split(' (')[0]} ({currentImageModel})
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Calcul des détails optiques, de l'éclairage et des textures...
                  </p>
                </div>
              </div>
            ) : latestItem ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group w-full rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 flex items-center justify-center max-h-[420px]"
              >
                <img
                  src={latestItem.url}
                  alt={latestItem.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain max-h-[420px]"
                />

                {/* Overlay hover actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-xs text-white line-clamp-2 mb-3 drop-shadow-sm font-medium">
                    {latestItem.originalPrompt || latestItem.prompt}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(latestItem)}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      title="Plein écran"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadMedia(latestItem.url, `studio-image-${latestItem.id}.png`)}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      title="Télécharger l'image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      title="Copier le prompt"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="aspect-video w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-300 flex flex-col items-center justify-center opacity-70 border-dashed p-6 text-center space-y-2">
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Aperçu en attente</p>
                <p className="text-xs font-medium text-slate-500 max-w-xs">
                  Les images générées apparaîtront ici avec les options de téléchargement et d'animation vidéo.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions Under Image */}
          {latestItem && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => downloadMedia(latestItem.url, `studio-image-${latestItem.id}.png`)}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Télécharger PNG</span>
              </button>

              <button
                type="button"
                onClick={() => onTransferToVideo(latestItem.url, latestItem.originalPrompt || latestItem.prompt)}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                title="Transférer directement vers le générateur vidéo Veo pour animer cette image"
              >
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                <span>Animer en Vidéo 🎬</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
