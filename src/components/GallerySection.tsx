import React, { useState } from 'react';
import {
  FolderHeart,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Download,
  Maximize2,
  Search,
  Copy,
  Check,
  Film,
  Calendar,
} from 'lucide-react';
import { GeneratedItem } from '../types';
import { downloadMedia, formatRelativeTime } from '../utils/file';

interface GallerySectionProps {
  items: GeneratedItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onOpenLightbox: (item: GeneratedItem) => void;
  onSelectPrompt: (prompt: string, type: 'image' | 'video', url?: string) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  items,
  onDeleteItem,
  onClearAll,
  onOpenLightbox,
  onSelectPrompt,
}) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.prompt.toLowerCase().includes(q) ||
        (item.originalPrompt && item.originalPrompt.toLowerCase().includes(q)) ||
        (item.styleName && item.styleName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('image')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              filter === 'image'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Images ({items.filter((i) => i.type === 'image').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('video')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              filter === 'video'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Vidéos ({items.filter((i) => i.type === 'video').length})</span>
          </button>
        </div>

        {/* Search & Clear History */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un mot-clé..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Voulez-vous réinitialiser l'historique de la galerie ?")) {
                  onClearAll();
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Vider la galerie"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-300 bg-white shadow-xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Aucune création dans cette catégorie</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Vos images et vidéos générées apparaîtront ici pour consultation, téléchargement et réutilisation.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              {/* Media Preview Container */}
              <div
                onClick={() => onOpenLightbox(item)}
                className="relative aspect-square w-full bg-slate-950 cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      src={item.url}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Film className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Corner Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'image'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {item.type}
                  </span>
                  {item.resolution && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/60 text-white backdrop-blur-xs font-mono">
                      {item.resolution}
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-black/60 text-white backdrop-blur-xs font-mono">
                    {item.aspectRatio}
                  </span>
                </div>
              </div>

              {/* Details & Prompt */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                    {item.originalPrompt || item.prompt}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {item.styleName && (
                      <span className="text-slate-500 font-medium">• {item.styleName}</span>
                    )}
                    {item.cameraMovement && (
                      <span className="text-slate-500 font-medium">• {item.cameraMovement}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Agrandir"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadMedia(
                          item.url,
                          `studio-${item.type}-${item.id}.${item.type === 'image' ? 'png' : 'mp4'}`
                        )
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.originalPrompt || item.prompt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Copier le prompt"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectPrompt(
                          item.originalPrompt || item.prompt,
                          item.type,
                          item.type === 'image' ? item.url : undefined
                        )
                      }
                      className="px-2 py-1 rounded-md text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                      title="Réutiliser dans le studio"
                    >
                      Réutiliser
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
