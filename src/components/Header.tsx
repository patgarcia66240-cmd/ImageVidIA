import React from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  FolderHeart,
  Film,
  Settings,
  Cpu,
} from 'lucide-react';
import { AIProviderConfig } from '../types';
import { PROVIDERS_META } from '../data/providers';

interface HeaderProps {
  activeTab: 'image' | 'video' | 'gallery';
  setActiveTab: (tab: 'image' | 'video' | 'gallery') => void;
  galleryCount: number;
  providerConfig: AIProviderConfig;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  galleryCount,
  providerConfig,
  onOpenSettings,
}) => {
  const activeMeta = PROVIDERS_META[providerConfig.activeProvider] || PROVIDERS_META.gemini;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10 ring-1 ring-slate-800/60 transition-transform hover:scale-105">
            <Film className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                <span>ImageVid</span>
                <span className="text-indigo-600">IA</span>
                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase rounded bg-slate-900 text-white">
                  PRO
                </span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Multi-Moteur
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Studio professionnel de génération d'images & vidéos cinématiques
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Professional Polish segmented pill style */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'image'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ImageIcon className={`w-4 h-4 ${activeTab === 'image' ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span>Générateur d'Images</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'video'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <VideoIcon className={`w-4 h-4 ${activeTab === 'video' ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span>Générateur de Vidéos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'gallery'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FolderHeart className={`w-4 h-4 ${activeTab === 'gallery' ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span>Galerie</span>
            {galleryCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200/60">
                {galleryCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Action & API Settings Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
            title="Configurer les clés API et les modèles"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span className="max-w-[120px] truncate text-slate-800">
              {activeMeta.name.split(' (')[0]}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
