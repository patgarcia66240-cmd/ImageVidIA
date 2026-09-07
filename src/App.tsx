import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageGenerator } from './components/ImageGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { GallerySection } from './components/GallerySection';
import { LightboxModal } from './components/LightboxModal';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { GeneratedItem, AIProviderConfig } from './types';
import { DEFAULT_PROVIDER_CONFIG, PROVIDERS_META } from './data/providers';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Settings, Sliders } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'studio_media_history_v1';
const PROVIDER_STORAGE_KEY = 'studio_ai_provider_config_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'gallery'>('image');
  const [galleryItems, setGalleryItems] = useState<GeneratedItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [providerConfig, setProviderConfig] = useState<AIProviderConfig>(() => {
    try {
      const saved = localStorage.getItem(PROVIDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to guarantee all fields and new providers exist
        return {
          activeProvider: parsed.activeProvider || DEFAULT_PROVIDER_CONFIG.activeProvider,
          providers: {
            ...DEFAULT_PROVIDER_CONFIG.providers,
            ...(parsed.providers || {}),
          },
        };
      }
      return DEFAULT_PROVIDER_CONFIG;
    } catch {
      return DEFAULT_PROVIDER_CONFIG;
    }
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GeneratedItem | null>(null);
  const [incomingImageForVideo, setIncomingImageForVideo] = useState<{
    url: string;
    prompt: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sauvegarder les médias dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(galleryItems));
    } catch (e) {
      console.warn('Erreur stockage local médias:', e);
    }
  }, [galleryItems]);

  // Sauvegarder la configuration des providers d'IA dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(providerConfig));
    } catch (e) {
      console.warn('Erreur stockage configuration providers:', e);
    }
  }, [providerConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProviderConfig = (newConfig: AIProviderConfig) => {
    setProviderConfig(newConfig);
    const meta = PROVIDERS_META[newConfig.activeProvider];
    showToast(`Moteur IA défini sur ${meta.name.split(' (')[0]} avec succès !`);
  };

  const handleMediaGenerated = (item: GeneratedItem) => {
    setGalleryItems((prev) => [item, ...prev]);
    showToast(
      item.type === 'image'
        ? 'Nouvelle image générée avec succès !'
        : 'Nouvelle vidéo cinématographique créée !'
    );
  };

  const handleDeleteItem = (id: string) => {
    setGalleryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setGalleryItems([]);
    showToast('La galerie a été réinitialisée.');
  };

  const handleTransferToVideo = (imageUrl: string, prompt: string) => {
    setIncomingImageForVideo({ url: imageUrl, prompt });
    setActiveTab('video');
    showToast('Image transférée vers le studio vidéo Veo !');
  };

  const handleSelectPromptFromGallery = (
    prompt: string,
    type: 'image' | 'video',
    imageUrl?: string
  ) => {
    if (type === 'image') {
      setActiveTab('image');
    } else {
      if (imageUrl) {
        setIncomingImageForVideo({ url: imageUrl, prompt });
      }
      setActiveTab('video');
    }
  };

  const activeMeta = PROVIDERS_META[providerConfig.activeProvider] || PROVIDERS_META.gemini;
  const currentProviderSettings = providerConfig.providers[providerConfig.activeProvider];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header Sticky Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        galleryCount={galleryItems.length}
        providerConfig={providerConfig}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner Informative Sub-bar - Professional Polish Style */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 shadow-2xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-slate-800">Fournisseur IA actif :</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              {activeMeta.name}
            </span>
            <span className="text-slate-500 text-[11px] hidden md:inline">
              (Image: <strong className="text-slate-700">{currentProviderSettings.imageModel}</strong>)
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 flex-wrap">
            <span className="hidden lg:inline">
              ✨ Optimiseur : <strong className="text-slate-700">{currentProviderSettings.enhancerModel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Changer d'IA ou de Clé</span>
            </button>
          </div>
        </div>

        {/* Tab Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'image' && (
            <motion.div
              key="image-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ImageGenerator
                onImageGenerated={handleMediaGenerated}
                onTransferToVideo={handleTransferToVideo}
                onOpenLightbox={setLightboxItem}
                providerConfig={providerConfig}
                onUpdateProviderConfig={handleSaveProviderConfig}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'video' && (
            <motion.div
              key="video-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <VideoGenerator
                onVideoGenerated={handleMediaGenerated}
                onOpenLightbox={setLightboxItem}
                incomingImage={incomingImageForVideo}
                onClearIncomingImage={() => setIncomingImageForVideo(null)}
                providerConfig={providerConfig}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <GallerySection
                items={galleryItems}
                onDeleteItem={handleDeleteItem}
                onClearAll={handleClearAll}
                onOpenLightbox={setLightboxItem}
                onSelectPrompt={handleSelectPromptFromGallery}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Provider & API Keys Modal */}
      <ProviderSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={providerConfig}
        onSaveConfig={handleSaveProviderConfig}
      />

      {/* Lightbox Modal */}
      <LightboxModal
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
        onTransferToVideo={handleTransferToVideo}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-xl text-xs font-bold text-slate-800"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Polish Footer */}
      <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
            Serveurs Opérationnels
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Multi-Moteur • {activeMeta.name.split(' (')[0]}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-medium">
          ImageVid IA • Studio Professionnel Image & Vidéo
        </div>
      </footer>
    </div>
  );
}
