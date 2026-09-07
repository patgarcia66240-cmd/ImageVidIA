import React, { useState } from 'react';
import {
  X,
  Key,
  Check,
  Eye,
  EyeOff,
  Cpu,
  Sparkles,
  Server,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Radio,
} from 'lucide-react';
import { AIProviderConfig, AIProviderId, ProviderItemSettings } from '../types';
import { PROVIDERS_META, DEFAULT_PROVIDER_CONFIG } from '../data/providers';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIProviderConfig;
  onSaveConfig: (newConfig: AIProviderConfig) => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<AIProviderId>(
    config.activeProvider
  );
  const [activeProviderChoice, setActiveProviderChoice] = useState<AIProviderId>(
    config.activeProvider
  );
  const [providersState, setProvidersState] = useState<
    Record<AIProviderId, ProviderItemSettings>
  >(() => JSON.parse(JSON.stringify(config.providers)));

  const [showKey, setShowKey] = useState(false);
  const [testingStatus, setTestingStatus] = useState<{
    isLoading: boolean;
    success?: boolean;
    message?: string;
  }>({ isLoading: false });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentMeta = PROVIDERS_META[selectedProviderId];
  const currentSettings = providersState[selectedProviderId];

  const handleUpdateCurrentSetting = (
    field: keyof ProviderItemSettings,
    value: any
  ) => {
    setProvidersState((prev) => ({
      ...prev,
      [selectedProviderId]: {
        ...prev[selectedProviderId],
        [field]: value,
      },
    }));
    setTestingStatus({ isLoading: false });
  };

  const handleTestConnection = async () => {
    setTestingStatus({ isLoading: true });
    try {
      const res = await fetch('/api/test-provider-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProviderId,
          apiKey: currentSettings.apiKey,
          baseUrl: currentSettings.baseUrl,
          model: currentSettings.enhancerModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestingStatus({
          isLoading: false,
          success: true,
          message: data.message || 'Connexion réussie !',
        });
      } else {
        setTestingStatus({
          isLoading: false,
          success: false,
          message: data.error || 'Échec de la validation de la clé.',
        });
      }
    } catch (err: any) {
      setTestingStatus({
        isLoading: false,
        success: false,
        message: err.message || 'Erreur réseau lors de la vérification.',
      });
    }
  };

  const handleSave = () => {
    const updated: AIProviderConfig = {
      activeProvider: activeProviderChoice,
      providers: providersState,
    };
    onSaveConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Voulez-vous réinitialiser tous les fournisseurs aux paramètres par défaut ?'
      )
    ) {
      setProvidersState(JSON.parse(JSON.stringify(DEFAULT_PROVIDER_CONFIG.providers)));
      setActiveProviderChoice(DEFAULT_PROVIDER_CONFIG.activeProvider);
      setSelectedProviderId(DEFAULT_PROVIDER_CONFIG.activeProvider);
      setTestingStatus({ isLoading: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Fournisseurs d'IA & Clés API Externes
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Multi-Moteur
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Configurez vos clés externes (ChatGPT, Gemini, Qwen) et choisissez vos modèles préférés.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar list + Detail Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation: Providers List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/70 p-3 space-y-1.5 overflow-y-auto">
            <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Choisir un Fournisseur
            </p>

            {(Object.keys(PROVIDERS_META) as AIProviderId[]).map((pid) => {
              const meta = PROVIDERS_META[pid];
              const isSelected = selectedProviderId === pid;
              const isActiveEngine = activeProviderChoice === pid;

              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => {
                    setSelectedProviderId(pid);
                    setTestingStatus({ isLoading: false });
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-white/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-indigo-950' : 'text-slate-800'
                        }`}
                      >
                        {meta.name.split(' (')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {meta.badge}
                    </span>
                  </div>

                  {isActiveEngine && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Check className="w-2.5 h-2.5" />
                      Actif
                    </span>
                  )}
                </button>
              );
            })}

            {/* Active Provider Indicator Card */}
            <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Moteur en cours d'usage :
              </span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {PROVIDERS_META[activeProviderChoice].name}
              </p>
            </div>
          </div>

          {/* Right Panel: Provider Settings Form */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 bg-white">
            {/* Header info for selected provider */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{currentMeta.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentMeta.description}
                </p>
              </div>

              {/* Set as Active Engine Button */}
              <div>
                {activeProviderChoice === selectedProviderId ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fournisseur Actif</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveProviderChoice(selectedProviderId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Définir comme actif</span>
                  </button>
                )}
              </div>
            </div>

            {/* Gemini specific toggle: Use default server key or custom key */}
            {selectedProviderId === 'gemini' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Source de la clé Gemini
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Utiliser la clé interne du serveur ou spécifier votre propre clé AI Studio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateCurrentSetting(
                        'customKeyEnabled',
                        !currentSettings.customKeyEnabled
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      currentSettings.customKeyEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        currentSettings.customKeyEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {!currentSettings.customKeyEnabled && (
                  <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    La clé par défaut du serveur est active pour Gemini Flash Image & Veo 3.1.
                  </p>
                )}
              </div>
            )}

            {/* API Key Input */}
            {(selectedProviderId !== 'gemini' || currentSettings.customKeyEnabled) && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    Clé API ({selectedProviderId.toUpperCase()})
                  </span>
                  {currentSettings.apiKey && (
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrentSetting('apiKey', '')}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Effacer la clé
                    </button>
                  )}
                </label>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={currentSettings.apiKey || ''}
                    onChange={(e) => handleUpdateCurrentSetting('apiKey', e.target.value)}
                    placeholder={currentMeta.keyPlaceholder}
                    className="w-full pl-3.5 pr-20 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title={showKey ? 'Masquer' : 'Afficher'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {currentMeta.keyHelp}
                </p>
              </div>
            )}

            {/* Custom Base URL (if supported) */}
            {currentMeta.allowsCustomBaseUrl && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-600" />
                  URL de Base de l'API (Endpoint)
                </label>
                <input
                  type="text"
                  value={currentSettings.baseUrl || ''}
                  onChange={(e) => handleUpdateCurrentSetting('baseUrl', e.target.value)}
                  placeholder={currentMeta.defaultBaseUrl}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                <p className="text-[11px] text-slate-400">
                  Par défaut : <code className="font-mono">{currentMeta.defaultBaseUrl}</code>
                </p>
              </div>
            )}

            {/* Models Selection */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Sélection des Modèles d'IA
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image Model */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Modèle de Génération d'Images
                    </label>
                  </div>
                  <select
                    value={currentSettings.imageModel}
                    onChange={(e) => handleUpdateCurrentSetting('imageModel', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {currentMeta.imageModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                    {!currentMeta.imageModels.some((m) => m.id === currentSettings.imageModel) && (
                      <option value={currentSettings.imageModel}>
                        {currentSettings.imageModel} (Personnalisé)
                      </option>
                    )}
                  </select>
                  <div className="pt-1">
                    <input
                      type="text"
                      value={currentSettings.imageModel}
                      onChange={(e) => handleUpdateCurrentSetting('imageModel', e.target.value)}
                      placeholder="Ou saisissez un ID personnalisé (ex: gpt-image-3)"
                      className="w-full px-2.5 py-1 text-[11px] font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                      title="Saisissez un identifiant précis de modèle"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Identifiant exact envoyé à l'API OpenAI (ex: <code className="font-mono text-indigo-600">gpt-image-3</code>, <code className="font-mono">gpt-image-2</code>, <code className="font-mono">dall-e-3</code>).
                    </p>
                  </div>
                </div>

                {/* Prompt Enhancer Model */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Modèle Optimiseur de Prompts
                  </label>
                  <select
                    value={currentSettings.enhancerModel}
                    onChange={(e) =>
                      handleUpdateCurrentSetting('enhancerModel', e.target.value)
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {currentMeta.enhancerModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                disabled={testingStatus.isLoading}
                onClick={handleTestConnection}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50"
              >
                {testingStatus.isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Test de connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tester la connexion</span>
                  </>
                )}
              </button>

              {testingStatus.message && (
                <div
                  className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${
                    testingStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testingStatus.success ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>{testingStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Rétablir les valeurs par défaut</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <span>Enregistrer les préférences</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
