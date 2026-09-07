import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

function getAIClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Aucune clé Gemini configurée (définissez-en une dans les paramètres ou via GEMINI_API_KEY).');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function cleanErrorMessage(error: any, provider: string = 'gemini'): string {
  if (!error) return 'Une erreur inconnue est survenue.';
  const rawMsg = typeof error === 'string' ? error : (error.message || String(error));

  const isGemini = provider === 'gemini';
  const providerLabel = provider === 'openai' ? 'OpenAI' : provider === 'qwen' ? 'Qwen' : 'IA';

  // Try to parse JSON embedded in ApiError messages
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        const detailMsg = parsed.error.message;
        if (
          parsed.error.code === 429 ||
          detailMsg.includes('Quota exceeded') ||
          detailMsg.includes('limit: 0') ||
          detailMsg.includes('RESOURCE_EXHAUSTED')
        ) {
          if (isGemini) {
            return "Quota dépassé (Erreur 429) : La génération d'images haute fidélité (Gemini 3.1 Flash Image) requiert une clé avec facturation activée (le quota gratuit est de 0 pour ce modèle). Veuillez activer une clé payante dans AI Studio ou renseigner votre clé personnelle dans les Paramètres IA.";
          }
          return `Quota ou limite de débit dépassé sur votre compte ${providerLabel} (Erreur 429). Vérifiez vos crédits ou votre plafond d'utilisation.`;
        }
        if (parsed.error.code === 403 || detailMsg.includes('PERMISSION_DENIED')) {
          return `Permission refusée (Erreur 403) : Votre clé API ${providerLabel} ne dispose pas des droits d'accès requis pour ce modèle.`;
        }
        return detailMsg;
      }
    }
  } catch {
    // continue to fallback checks
  }

  if (
    rawMsg.includes('Quota exceeded') ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('limit: 0') ||
    rawMsg.includes('429')
  ) {
    if (isGemini) {
      return "Quota dépassé (Erreur 429) : La génération d'images haute fidélité (Gemini 3.1 Flash Image) requiert une clé avec facturation activée (quota gratuit à 0). Veuillez activer une clé payante dans AI Studio ou renseigner votre clé personnelle dans les Paramètres IA.";
    }
    return `Quota ou limite de débit dépassé sur votre compte ${providerLabel} (Erreur 429). Vérifiez vos crédits API.`;
  }

  if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('401') || rawMsg.includes('Unauthorized')) {
    return `Clé API ${providerLabel} non reconnue ou invalide (401). Vérifiez la saisie dans les Paramètres IA.`;
  }

  if (
    rawMsg.includes('model_not_found') ||
    rawMsg.includes('does not exist') ||
    (rawMsg.includes('The model') && (rawMsg.includes('not found') || rawMsg.includes('invalid')))
  ) {
    if (provider === 'openai') {
      return `${rawMsg}. Conseil : Si ce modèle n'est pas encore actif sur votre compte OpenAI, essayez 'gpt-image-2', 'gpt-image-1.5' ou 'dall-e-3' dans les Paramètres IA.`;
    }
    return `${rawMsg}. Vérifiez le nom du modèle sélectionné.`;
  }

  return rawMsg;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Augmenter la limite pour permettre les uploads d'images en base64
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // --- API ROUTES ---

  // Health check & API key status
  app.get('/api/status', (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      hasApiKey: hasKey,
      availableModels: {
        image: ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'],
        video: ['veo-3.1-lite-generate-preview', 'veo-3.1-generate-preview'],
        enhancer: 'gemini-3.8-flash',
      },
    });
  });

  // Test provider connection
  app.post('/api/test-provider-key', async (req, res) => {
    try {
      const { provider, apiKey, baseUrl, model } = req.body;
      if (!provider) {
        return res.status(400).json({ error: 'Fournisseur non spécifié.' });
      }

      if (provider === 'gemini') {
        const testKey = apiKey || process.env.GEMINI_API_KEY;
        if (!testKey) {
          return res.status(400).json({ error: 'Clé API Gemini requise.' });
        }
        const client = new GoogleGenAI({ apiKey: testKey });
        // Requête ultra-légère de vérification
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Ping',
        });
        if (response) {
          return res.json({ success: true, message: 'Clé Google Gemini validée avec succès !' });
        }
      } else if (provider === 'openai') {
        if (!apiKey) {
          return res.status(400).json({ error: 'Clé API OpenAI requise.' });
        }
        const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '') + '/models';
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (response.ok) {
          return res.json({ success: true, message: 'Connexion OpenAI établie avec succès !' });
        } else {
          const err = await response.json().catch(() => ({}));
          return res.status(response.status).json({
            error: err.error?.message || `Erreur OpenAI (${response.statusText})`,
          });
        }
      } else if (provider === 'qwen' || provider === 'custom') {
        if (!baseUrl) {
          return res.status(400).json({ error: 'URL de base (Base URL) requise.' });
        }
        const url = baseUrl.replace(/\/$/, '') + '/models';
        const response = await fetch(url, {
          headers: {
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            'HTTP-Referer': 'https://aistudio.google.com',
            'X-Title': 'Studio IA Pro',
          },
        });
        if (response.ok) {
          return res.json({ success: true, message: `Connexion ${provider.toUpperCase()} validée avec succès !` });
        } else {
          // Tenter un chat completion minimal si /models est désactivé
          const chatUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
          const chatRes = await fetch(chatUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({
              model: model || 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 5,
            }),
          });
          if (chatRes.ok) {
            return res.json({ success: true, message: 'Connexion établie avec succès !' });
          }
          const chatErr = await chatRes.json().catch(() => ({}));
          return res.status(chatRes.status).json({
            error: chatErr.error?.message || `Erreur de connexion (${chatRes.statusText})`,
          });
        }
      }

      res.status(400).json({ error: 'Fournisseur non reconnu.' });
    } catch (err: any) {
      console.error('Erreur test-provider-key:', err);
      res.status(500).json({ error: err.message || 'Impossible de vérifier la clé API.' });
    }
  });

  // Prompt Enhancer endpoint (Multi-provider)
  app.post('/api/enhance-prompt', async (req, res) => {
    try {
      const { prompt, mediaType, providerConfig } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Le prompt est requis.' });
      }

      const activeProvider = providerConfig?.activeProvider || 'gemini';
      const providerSettings = providerConfig?.providers?.[activeProvider] || {};

      const promptInstructions = `Tu es un directeur artistique et expert mondial en prompt engineering pour modèles génératifs visuels (images haute fidélité et vidéos cinématographiques).
L'utilisateur a donné cette idée de base : "${prompt}".
Type de média souhaité : ${mediaType === 'video' ? 'Vidéo cinématographique animée' : 'Image haute définition'}.

Instructions :
- Améliore cette idée en une description visuelle riche, percutante et détaillée.
- Pour une vidéo : décris la trajectoire ou le mouvement subtil de caméra, l'ambiance lumineuse, les textures dynamiques et le rythme temporel.
- Pour une image : décris le cadrage, l'éclairage volumétrique, les micro-détails, les couleurs et l'atmosphère optique.
- Rédige le résultat directement en français (ou bilingue français/mots-clés visuels), de façon concise et efficace (2 à 4 phrases maximum).
- Retourne STRICTEMENT le texte du prompt enrichi, sans préambule, sans guillemets autour, sans explications.`;

      // Multi-provider execution
      if (activeProvider === 'openai' || activeProvider === 'qwen' || activeProvider === 'custom') {
        const baseUrl = (
          providerSettings.baseUrl ||
          (activeProvider === 'openai' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1')
        ).replace(/\/$/, '');
        const apiKey = providerSettings.apiKey;
        const model =
          providerSettings.enhancerModel ||
          (activeProvider === 'openai' ? 'gpt-4o-mini' : 'qwen/qwen-2.5-72b-instruct');

        if (!apiKey && activeProvider !== 'custom') {
          return res.status(400).json({
            error: `Veuillez renseigner votre clé API ${activeProvider.toUpperCase()} dans les Paramètres d'IA.`,
          });
        }

        const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            'HTTP-Referer': 'https://aistudio.google.com',
            'X-Title': 'Studio IA Pro',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: promptInstructions },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        const chatData = await chatResponse.json();
        if (!chatResponse.ok || chatData.error) {
          throw new Error(
            chatData.error?.message || `Erreur ${activeProvider.toUpperCase()} lors de l'optimisation.`
          );
        }

        const enhancedText = chatData.choices?.[0]?.message?.content?.trim() || prompt;
        return res.json({ enhancedPrompt: enhancedText });
      }

      // Default: Google Gemini
      const customKey = providerSettings.customKeyEnabled ? providerSettings.apiKey : undefined;
      const ai = getAIClient(customKey);
      const modelToUse = providerSettings.enhancerModel || 'gemini-3.8-flash';

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: promptInstructions,
      });

      const enhancedText = response.text?.trim() || prompt;
      res.json({ enhancedPrompt: enhancedText });
    } catch (error: any) {
      console.error('Erreur enhance-prompt:', error);
      const activeProvider = req.body?.providerConfig?.activeProvider || 'gemini';
      res.status(500).json({
        error: cleanErrorMessage(error, activeProvider),
      });
    }
  });

  // Image Generation endpoint (Multi-provider)
  app.post('/api/generate-image', async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = '1:1',
        imageSize = '1K',
        model = 'gemini-3.1-flash-image',
        inputImage,
        providerConfig,
      } = req.body;

      if (!prompt && !inputImage) {
        return res.status(400).json({ error: 'Un prompt ou une image de référence est requis.' });
      }

      const activeProvider = providerConfig?.activeProvider || 'gemini';
      const providerSettings = providerConfig?.providers?.[activeProvider] || {};

      // --- OpenAI Image Generation (GPT Image / DALL-E) ---
      if (activeProvider === 'openai') {
        const apiKey = providerSettings.apiKey;
        if (!apiKey) {
          return res.status(400).json({
            error: 'Veuillez saisir votre clé API OpenAI dans la boîte de configuration IA.',
          });
        }

        const baseUrl = (providerSettings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
        let chosenModel = (providerSettings.imageModel || model || 'gpt-image-3').trim();

        // Normalisation souple : supporte "gptimage 3", "gptimage-3", "gpt image 3", etc.
        const normalized = chosenModel.toLowerCase().replace(/[\s_-]+/g, '');
        if (normalized === 'gptimage3' || normalized === 'gpt3image') {
          chosenModel = 'gpt-image-3';
        } else if (normalized === 'gptimage2') {
          chosenModel = 'gpt-image-2';
        } else if (normalized === 'gptimage15') {
          chosenModel = 'gpt-image-1.5';
        } else if (normalized === 'gptimage1') {
          chosenModel = 'gpt-image-1';
        }

        // Format de dimensions adapté selon la famille de modèle OpenAI
        let size = '1024x1024';
        const isGptImage = chosenModel.toLowerCase().startsWith('gpt-image') || chosenModel.toLowerCase().startsWith('gptimage');
        if (chosenModel === 'dall-e-2') {
          size = '1024x1024';
        } else if (isGptImage) {
          if (aspectRatio === '16:9') size = '1536x1024';
          else if (aspectRatio === '9:16') size = '1024x1536';
          else size = '1024x1024';
        } else {
          // dall-e-3
          if (aspectRatio === '16:9') size = '1792x1024';
          else if (aspectRatio === '9:16') size = '1024x1792';
          else size = '1024x1024';
        }

        // Requête à l'API OpenAI sans le paramètre obsolète/incompatible 'response_format'
        const requestPayload: any = {
          model: chosenModel,
          prompt,
          n: 1,
          size,
        };

        const openAiRes = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestPayload),
        });

        const openAiData = await openAiRes.json();
        if (!openAiRes.ok || openAiData.error) {
          return res.status(openAiRes.status || 500).json({
            error: cleanErrorMessage(openAiData.error?.message || 'Échec de la génération OpenAI.', 'openai'),
          });
        }

        const b64 = openAiData.data?.[0]?.b64_json;
        const remoteUrl = openAiData.data?.[0]?.url;
        let imageUrl = b64 ? `data:image/png;base64,${b64}` : remoteUrl;

        // Si une URL distante est renvoyée (ex: DALL-E), la convertir en base64 pour éviter l'expiration après 1 heure
        if (!b64 && remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
          try {
            const imgFetch = await fetch(remoteUrl);
            if (imgFetch.ok) {
              const arrayBuffer = await imgFetch.arrayBuffer();
              const mime = imgFetch.headers.get('content-type') || 'image/png';
              imageUrl = `data:${mime};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
            }
          } catch (err) {
            console.warn('Conversion URL distante OpenAI vers base64 non effectuée, URL originale conservée:', err);
          }
        }

        if (!imageUrl) {
          return res.status(500).json({ error: 'Aucune image renvoyée par OpenAI.' });
        }

        return res.json({
          success: true,
          imageUrl,
          modelUsed: chosenModel,
        });
      }

      // --- Qwen / OpenRouter / Custom Images ---
      if (activeProvider === 'qwen' || activeProvider === 'custom') {
        const apiKey = providerSettings.apiKey;
        const baseUrl = (
          providerSettings.baseUrl ||
          (activeProvider === 'qwen' ? 'https://openrouter.ai/api/v1' : 'http://localhost:11434/v1')
        ).replace(/\/$/, '');
        const chosenModel = providerSettings.imageModel || 'black-forest-labs/flux-1-schnell';

        if (!apiKey && activeProvider !== 'custom') {
          return res.status(400).json({
            error: `Veuillez renseigner votre clé API pour ${activeProvider.toUpperCase()} dans les paramètres.`,
          });
        }

        // Tenter endpoint standard /images/generations sans response_format incompatible
        const imgRes = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            'HTTP-Referer': 'https://aistudio.google.com',
            'X-Title': 'Studio IA Pro',
          },
          body: JSON.stringify({
            model: chosenModel,
            prompt,
            n: 1,
          }),
        });

        const imgData = await imgRes.json();
        if (imgRes.ok && imgData.data?.[0]) {
          const b64 = imgData.data[0].b64_json;
          const remoteUrl = imgData.data[0].url;
          let imageUrl = b64 ? `data:image/png;base64,${b64}` : remoteUrl;

          if (!b64 && remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
            try {
              const fetchRemote = await fetch(remoteUrl);
              if (fetchRemote.ok) {
                const buf = await fetchRemote.arrayBuffer();
                const mime = fetchRemote.headers.get('content-type') || 'image/png';
                imageUrl = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
              }
            } catch (convErr) {
              console.warn('Erreur conversion image distante en base64:', convErr);
            }
          }

          return res.json({
            success: true,
            imageUrl,
            modelUsed: chosenModel,
          });
        }

        // Si échec sur endpoint image direct
        return res.status(imgRes.status || 500).json({
          error: cleanErrorMessage(
            imgData.error?.message ||
            `Le modèle ${chosenModel} n'a pas pu être exécuté via ${baseUrl}/images/generations. Vérifiez vos paramètres ou utilisez Google Gemini Image.`
          ),
        });
      }

      // --- Default Google Gemini Flash Image ---
      const customKey = providerSettings.customKeyEnabled ? providerSettings.apiKey : undefined;
      const ai = getAIClient(customKey);
      const chosenModel = providerSettings.imageModel || model;

      const parts: any[] = [];
      if (inputImage && inputImage.data) {
        parts.push({
          inlineData: {
            data: inputImage.data,
            mimeType: inputImage.mimeType || 'image/png',
          },
        });
      }
      if (prompt) {
        parts.push({ text: prompt });
      }

      const imageConfig: any = {
        aspectRatio,
      };

      if (chosenModel === 'gemini-3.1-flash-image' && imageSize) {
        imageConfig.imageSize = imageSize;
      }

      const response = await ai.models.generateContent({
        model: chosenModel,
        contents: { parts },
        config: {
          imageConfig,
        },
      });

      let imageUrl: string | null = null;
      let textResponse = '';

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textResponse += part.text;
        }
      }

      if (!imageUrl) {
        return res.status(500).json({
          error: textResponse || 'Aucune image n\'a été retournée par le modèle.',
        });
      }

      res.json({
        success: true,
        imageUrl,
        textResponse,
        modelUsed: chosenModel,
      });
    } catch (error: any) {
      console.error('Erreur generate-image:', error);
      const activeProvider = req.body?.providerConfig?.activeProvider || 'gemini';
      res.status(500).json({
        error: cleanErrorMessage(error, activeProvider),
      });
    }
  });

  // Video Generation Start endpoint
  app.post('/api/generate-video', async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = '16:9',
        resolution = '720p',
        model = 'veo-3.1-lite-generate-preview',
        inputImage,
        lastFrame,
        providerConfig,
      } = req.body;

      if (!prompt && !inputImage) {
        return res.status(400).json({ error: 'Un prompt ou une image de départ est requis pour générer une vidéo.' });
      }

      const activeProvider = providerConfig?.activeProvider || 'gemini';
      const providerSettings = providerConfig?.providers?.[activeProvider] || {};
      const customKey = providerSettings.customKeyEnabled ? providerSettings.apiKey : undefined;
      const ai = getAIClient(customKey);

      const config: any = {
        numberOfVideos: 1,
        resolution,
        aspectRatio,
      };

      if (lastFrame && lastFrame.data) {
        config.lastFrame = {
          imageBytes: lastFrame.data,
          mimeType: lastFrame.mimeType || 'image/png',
        };
      }

      const videoPayload: any = {
        model,
        config,
      };

      if (prompt) {
        videoPayload.prompt = prompt;
      }

      if (inputImage && inputImage.data) {
        videoPayload.image = {
          imageBytes: inputImage.data,
          mimeType: inputImage.mimeType || 'image/png',
        };
      }

      const operation = await ai.models.generateVideos(videoPayload);

      res.json({
        success: true,
        operationName: operation.name,
      });
    } catch (error: any) {
      console.error('Erreur generate-video:', error);
      res.status(500).json({
        error: cleanErrorMessage(error),
      });
    }
  });

  // Video Status Polling endpoint
  app.post('/api/video-status', async (req, res) => {
    try {
      const { operationName, providerConfig } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: 'operationName est requis.' });
      }

      const activeProvider = providerConfig?.activeProvider || 'gemini';
      const providerSettings = providerConfig?.providers?.[activeProvider] || {};
      const customKey = providerSettings.customKeyEnabled ? providerSettings.apiKey : undefined;
      const ai = getAIClient(customKey);
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });

      res.json({
        done: Boolean(updated.done),
        error: updated.error ? cleanErrorMessage(updated.error.message || 'Erreur inconnue lors du rendu') : null,
      });
    } catch (error: any) {
      console.error('Erreur video-status:', error);
      res.status(500).json({
        error: cleanErrorMessage(error),
      });
    }
  });

  // Video Download / Streaming endpoint
  app.post('/api/video-download', async (req, res) => {
    try {
      const { operationName, providerConfig } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: 'operationName est requis.' });
      }

      const activeProvider = providerConfig?.activeProvider || 'gemini';
      const providerSettings = providerConfig?.providers?.[activeProvider] || {};
      const customKey = providerSettings.customKeyEnabled ? providerSettings.apiKey : undefined;
      const ai = getAIClient(customKey);
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });
      if (updated.error) {
        return res.status(500).json({ error: cleanErrorMessage(updated.error.message) });
      }

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: 'URI de vidéo non trouvée dans l\'opération terminée.' });
      }

      const apiKey = customKey || process.env.GEMINI_API_KEY;
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey || '' },
      });

      if (!videoRes.ok) {
        return res.status(videoRes.status).json({
          error: `Erreur lors de la récupération du fichier vidéo (${videoRes.statusText})`,
        });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      const arrayBuffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error('Erreur video-download:', error);
      res.status(500).json({
        error: cleanErrorMessage(error),
      });
    }
  });

  // --- VITE SPA FALLBACK / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur actif sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Échec critique au démarrage du serveur:', err);
  process.exit(1);
});
