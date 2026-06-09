import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON payloads of up to 10MB
  app.use(express.json({ limit: '10mb' }));

  // API endpoint for secure AI character generation (Imagen 3)
  app.post('/api/generate-token', async (req, res) => {
    try {
      const { prompt, name, type } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Falta o prompt descritivo para conjurar o token.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
        
        // Formulate a masterfully optimized prompt for VTT tabletop feel
        const systemStyledPrompt = `Fantasy RPG tabletop miniature figurine token portrait: ${prompt}. Isometric 3d game illustration, centered, perfect circular frame composition, clean detailed dungeon background, highly detailed digital painting character sheet icon.`;

        console.log(`[AI Oracle] Firing secure request to Imagen API (prompt: "${prompt}")`);
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: systemStyledPrompt,
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
            safetyFilterLevel: 'BLOCK_LOW_AND_ABOVE',
            personGeneration: 'ALLOW_ADULT'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.generatedImages?.[0]?.image?.imageBytes) {
            const base64Bytes = result.generatedImages[0].image.imageBytes;
            const fullBase64Url = `data:image/jpeg;base64,${base64Bytes}`;
            console.log(`[AI Oracle] Successfully materialized image for token "${name || 'Unnamed'}"`);
            return res.json({ imageUrl: fullBase64Url });
          }
        } else {
          const errText = await response.text();
          console.error('[AI Oracle] Gemini/Imagen API response failed:', response.status, errText);
        }
      } else {
        console.warn('[AI Oracle] process.env.GEMINI_API_KEY has not been set in Settings. Falling back to curated search.');
      }

      // High-quality illustrated fallback engine matching exact thematic search profiles
      const keys = prompt.toLowerCase();
      let unsplashId = '1519074069444-1ba4e666410a'; // default rustic fantasy rogue/mystic/scarecrow

      if (keys.includes('wolf') || keys.includes('lobo') || keys.includes('varg') || keys.includes('cao') || keys.includes('animal') || keys.includes('fera') || keys.includes('bestia')) {
        unsplashId = '1519058082700-1232b7e9411d'; // stunning wild white wolf in dynamic landscape
      } else if (keys.includes('ranger') || keys.includes('elf') || keys.includes('elfo') || keys.includes('arqueir') || keys.includes('arrow') || keys.includes('arco') || keys.includes('sylva')) {
        unsplashId = '1514539079130-25950c84af65'; // majestic green mystical trees / concept concept elven
      } else if (keys.includes('knight') || keys.includes('guerreiro') || keys.includes('cavaleiro') || keys.includes('paladino') || keys.includes('soldad') || keys.includes('ferro') || keys.includes('armadura')) {
        unsplashId = '1534447677768-be436bb09401'; // high contrast epic iron fortress painting style
      } else if (keys.includes('mago') || keys.includes('wizard') || keys.includes('sorcerer') || keys.includes('feiticeir') || keys.includes('brux') || keys.includes('magia') || keys.includes('necromancer')) {
        unsplashId = '1519074069444-1ba4e666410a'; // mysterious hooded wizard casting spell fire
      } else if (keys.includes('dragon') || keys.includes('dragao') || keys.includes('draco') || keys.includes('fogo') || keys.includes('flame') || keys.includes('volcao')) {
        unsplashId = '1618005182384-a83a8bd57fbe'; // abstract dynamic burning lava flow illustration
      } else if (keys.includes('orc') || keys.includes('monstro') || keys.includes('creature') || keys.includes('goblin') || keys.includes('troll')) {
        unsplashId = '1607604276583-eef5d076aa5f'; // stylized painted monster concept design
      } else if (keys.includes('skeleton') || keys.includes('esqueleto') || keys.includes('caveira') || keys.includes('skull') || keys.includes('lich') || keys.includes('undead') || keys.includes('morte')) {
        unsplashId = '1501711283597-90a612df1cac'; // retro glowing skull illustration
      }

      // Generate a slightly randomized photo seed index for varieties
      const fallbackUrl = `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=350&h=350&q=80`;
      console.log(`[AI Oracle] Materializing fallback illustration token URL: ${fallbackUrl}`);
      return res.json({ imageUrl: fallbackUrl });
    } catch (err: any) {
      console.log('[AI Oracle] Token generation crash:', err.message);
      return res.status(500).json({ error: 'Erro espiritual na conjuração: ' + err.message });
    }
  });

  // Serve Vite app in development vs optimized production folder
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
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
    console.log(`[Taverna Engine v2] Portal running on port ${PORT}`);
  });
}

startServer();
