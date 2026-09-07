import { AIProviderConfig, AIProviderId } from '../types';

export interface ProviderMeta {
  id: AIProviderId;
  name: string;
  badge: string;
  description: string;
  logoColor: string;
  defaultBaseUrl?: string;
  imageModels: { id: string; name: string; description: string }[];
  videoModels: { id: string; name: string; description: string }[];
  enhancerModels: { id: string; name: string; description: string }[];
  keyHelp: string;
  keyPlaceholder: string;
  allowsCustomBaseUrl?: boolean;
}

export const PROVIDERS_META: Record<AIProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini & Veo',
    badge: 'Recommandé',
    description: 'Moteur multimodal natif de Google avec génération d\'images photoréalistes et vidéos cinématiques Veo 3.1.',
    logoColor: 'from-blue-600 to-indigo-600',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    imageModels: [
      {
        id: 'gemini-3.1-flash-image',
        name: 'Gemini 3.1 Flash Image',
        description: 'Qualité maximale photoréaliste et fidélité de prompt (1K, 2K).',
      },
      {
        id: 'gemini-3.1-flash-lite-image',
        name: 'Gemini 3.1 Flash Lite Image',
        description: 'Version ultra-rapide pour itérations visuelles instantanées.',
      },
    ],
    videoModels: [
      {
        id: 'veo-3.1-lite-generate-preview',
        name: 'Veo 3.1 Lite Preview',
        description: 'Génération vidéo fluide, rapide et cinématographique (720p / 1080p).',
      },
      {
        id: 'veo-3.1-generate-preview',
        name: 'Veo 3.1 Standard',
        description: 'Haute cohérence temporelle et gestion avancée de la caméra.',
      },
    ],
    enhancerModels: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        description: 'Optimiseur de prompts visuels et cinématiques haute précision.',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Directeur artistique réactif pour enrichissement de scènes.',
      },
    ],
    keyHelp: 'Par défaut, la clé serveur Gemini configurée est utilisée. Vous pouvez spécifier votre propre clé Google AI Studio.',
    keyPlaceholder: 'AIzaSy...',
    allowsCustomBaseUrl: false,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT & DALL·E)',
    badge: 'Populaire',
    description: 'Accédez à DALL·E 3 pour des rendus créatifs haute résolution et à GPT-4o pour la scénarisation.',
    logoColor: 'from-emerald-600 to-teal-600',
    defaultBaseUrl: 'https://api.openai.com/v1',
    imageModels: [
      {
        id: 'gpt-image-3',
        name: 'GPT Image 3 (gpt-image-3)',
        description: 'Dernière génération de modèle d\'image OpenAI haute fidélité avec photoréalisme et cohérence typographique.',
      },
      {
        id: 'gpt-image-2',
        name: 'GPT Image 2 (gpt-image-2)',
        description: 'Modèle visuel avec raisonnement avancé et détails haute définition.',
      },
      {
        id: 'gpt-image-1.5',
        name: 'GPT Image 1.5 (gpt-image-1.5)',
        description: 'Dernière génération OpenAI : rendu photoréaliste, génération ultra-rapide et haute précision.',
      },
      {
        id: 'gpt-image-1',
        name: 'GPT Image 1 (gpt-image-1)',
        description: 'Génération visuelle solide et polyvalente.',
      },
      {
        id: 'dall-e-3',
        name: 'DALL·E 3',
        description: 'Rendu artistique détaillé avec forte compréhension sémantique.',
      },
      {
        id: 'dall-e-2',
        name: 'DALL·E 2',
        description: 'Génération d\'images rapide et standard.',
      },
    ],
    videoModels: [
      {
        id: 'veo-3.1-lite-generate-preview',
        name: 'Veo 3.1 (Passerelle Google)',
        description: 'Les vidéos restent générées via Veo 3.1 pour une fluidité maximale.',
      },
    ],
    enhancerModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Directeur artistique de pointe pour scénarisation complète.',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Optimiseur de prompt ultra-rapide et économique.',
      },
    ],
    keyHelp: 'Obtenez votre clé sur platform.openai.com. Elle sera transmise de manière sécurisée pour vos requêtes.',
    keyPlaceholder: 'sk-proj-...',
    allowsCustomBaseUrl: true,
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen & Alibaba / OpenRouter',
    badge: 'Haute Capacité',
    description: 'Modèles de la famille Tongyi / Qwen ou passerelle OpenRouter pour modèles open-source de pointe.',
    logoColor: 'from-amber-600 to-orange-600',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    imageModels: [
      {
        id: 'black-forest-labs/flux-1-schnell',
        name: 'FLUX.1 Schnell (via OpenRouter)',
        description: 'Modèle de pointe photoréaliste et ultra-rapide.',
      },
      {
        id: 'black-forest-labs/flux-1-dev',
        name: 'FLUX.1 Dev (via OpenRouter)',
        description: 'Génération d\'image haute fidélité avec rendu de texte soigné.',
      },
      {
        id: 'wanx-v1',
        name: 'Tongyi Wanxiang (DashScope)',
        description: 'Modèle de création visuelle propriétaire Alibaba Wanx.',
      },
    ],
    videoModels: [
      {
        id: 'veo-3.1-lite-generate-preview',
        name: 'Veo 3.1 (Passerelle Google)',
        description: 'Moteur vidéo Veo connecté en arrière-plan pour le rendu cinématique.',
      },
    ],
    enhancerModels: [
      {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B Instruct',
        description: 'Excellente capacité de raisonnement et de prompt engineering.',
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B',
        description: 'Directeur de scène précis et méthodique.',
      },
    ],
    keyHelp: 'Compatible avec les clés OpenRouter (sk-or-...) ou Alibaba Cloud DashScope.',
    keyPlaceholder: 'sk-or-v1-... ou sk-...',
    allowsCustomBaseUrl: true,
  },
  custom: {
    id: 'custom',
    name: 'Fournisseur Personnalisé (OpenAI Compatible)',
    badge: 'Avancé',
    description: 'Connectez n\'importe quel serveur ou passerelle locale (Ollama, vLLM, Groq, Mistral, Together AI).',
    logoColor: 'from-purple-600 to-pink-600',
    defaultBaseUrl: 'http://localhost:11434/v1',
    imageModels: [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3 ou compatible',
        description: 'Endpoint image standard /v1/images/generations.',
      },
      {
        id: 'custom-image',
        name: 'Modèle d\'image personnalisé',
        description: 'Spécifiez le nom exact du modèle hébergé.',
      },
    ],
    videoModels: [
      {
        id: 'veo-3.1-lite-generate-preview',
        name: 'Veo 3.1 (Passerelle Google)',
        description: 'Rendu cinématique Veo maintenu pour la génération vidéo.',
      },
    ],
    enhancerModels: [
      {
        id: 'custom-llm',
        name: 'Modèle de complétion personnalisé',
        description: 'Compatible avec l\'endpoint standard /v1/chat/completions.',
      },
    ],
    keyHelp: 'Spécifiez l\'URL de base de l\'API ainsi que la clé d\'accès nécessaire.',
    keyPlaceholder: 'Clé API ou token Bearer...',
    allowsCustomBaseUrl: true,
  },
};

export const DEFAULT_PROVIDER_CONFIG: AIProviderConfig = {
  activeProvider: 'gemini',
  providers: {
    gemini: {
      apiKey: '',
      customKeyEnabled: false,
      imageModel: 'gemini-3.1-flash-image',
      videoModel: 'veo-3.1-lite-generate-preview',
      enhancerModel: 'gemini-3.8-flash',
      baseUrl: 'https://generativelanguage.googleapis.com',
    },
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      imageModel: 'gpt-image-3',
      videoModel: 'veo-3.1-lite-generate-preview',
      enhancerModel: 'gpt-4o-mini',
    },
    qwen: {
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      imageModel: 'black-forest-labs/flux-1-schnell',
      videoModel: 'veo-3.1-lite-generate-preview',
      enhancerModel: 'qwen/qwen-2.5-72b-instruct',
    },
    custom: {
      apiKey: '',
      baseUrl: 'http://localhost:11434/v1',
      imageModel: 'dall-e-3',
      videoModel: 'veo-3.1-lite-generate-preview',
      enhancerModel: 'custom-llm',
    },
  },
};
