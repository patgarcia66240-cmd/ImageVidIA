import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Film,
  Image as ImageIcon,
  Calendar,
} from 'lucide-react';
import { GeneratedItem } from '../types';
import { downloadMedia, formatRelativeTime } from '../utils/file';

interface LightboxModalProps {
  item: GeneratedItem | null;
  onClose: () => void;
  onTransferToVideo?: (imageUrl: string, prompt: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  onClose,
  onTransferToVideo,
}) => {
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.originalPrompt || item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Media Preview Area */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center min-h-[320px] max-h-[60vh] lg:max-h-none overflow-hidden p-4">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.prompt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain max-h-[78vh] rounded-lg"
            />
          ) : (
            <video
              ref={videoRef}
              src={item.url}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain max-h-[78vh] rounded-lg"
            />
          )}
        </div>

        {/* Sidebar Info & Metadata */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto bg-slate-50/50">
          <div className="space-y-4">
            {/* Type & Format */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    item.type === 'image'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  {item.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Film className="w-3.5 h-3.5 text-purple-600" />
                  )}
                  <span>{item.type}</span>
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">
                  {item.aspectRatio}
                </span>
              </div>

              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Prompt :</span>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-44 overflow-y-auto shadow-xs">
                {item.originalPrompt || item.prompt}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mt-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Prompt copié !' : 'Copier le prompt'}</span>
              </button>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Détails techniques :</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-medium block">Moteur IA</span>
                  <span className="font-mono text-slate-800 text-[11px] font-bold truncate block">
                    {item.model}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-medium block">Définition</span>
                  <span className="font-mono text-slate-800 text-[11px] font-bold block">
                    {item.resolution || 'Standard'}
                  </span>
                </div>

                {item.styleName && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 col-span-2">
                    <span className="text-[10px] text-slate-400 font-medium block">Style</span>
                    <span className="text-slate-800 text-[11px] font-semibold">{item.styleName}</span>
                  </div>
                )}

                {item.cameraMovement && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 col-span-2">
                    <span className="text-[10px] text-slate-400 font-medium block">Mouvement de caméra</span>
                    <span className="text-slate-800 text-[11px] font-semibold">{item.cameraMovement}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-4 border-t border-slate-200 space-y-2 mt-4">
            <button
              type="button"
              onClick={() =>
                downloadMedia(
                  item.url,
                  `studio-${item.type}-${item.id}.${item.type === 'image' ? 'png' : 'mp4'}`
                )
              }
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le fichier haute résolution</span>
            </button>

            {item.type === 'image' && onTransferToVideo && (
              <button
                type="button"
                onClick={() => {
                  onTransferToVideo(item.url, item.originalPrompt || item.prompt);
                  onClose();
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Film className="w-3.5 h-3.5 text-indigo-600" />
                <span>Animer cette image en vidéo avec Veo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
