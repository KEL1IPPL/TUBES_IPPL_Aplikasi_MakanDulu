import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_MENU_ITEMS, STORE_PROFILES, AVAILABLE_VOUCHERS } from './src/data/dataMock.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS Middleware sederhana untuk kemudahan pengembangan lokal
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// 1. Healthcheck Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'MakanDulu Food Ecosystem API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Katalog Menu Endpoint
app.get('/api/menu', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: INITIAL_MENU_ITEMS.length,
    data: INITIAL_MENU_ITEMS
  });
});

// 3. Profil Toko & Mitra Restoran Endpoint
app.get('/api/stores', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: STORE_PROFILES
  });
});

// 4. Voucher & Promo Endpoint
app.get('/api/vouchers', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: AVAILABLE_VOUCHERS
  });
});

// 5. Buat Pesanan Baru Endpoint (Mock Order Processing)
app.post('/api/orders', (req: Request, res: Response) => {
  const { items, total, paymentMethod, address } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Item pesanan tidak boleh kosong.' });
  }

  const orderNumber = `MKD-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderRecord = {
    id: `order-${Date.now()}`,
    orderNumber,
    items,
    total,
    paymentMethod,
    address,
    status: 'dimasak',
    createdAt: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    message: 'Pesanan berhasil dibuat dan diteruskan ke dapur resto!',
    data: orderRecord
  });
});

// 6. Gemini AI Culinary Recommendation Endpoint
app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Kueri pertanyaan diperlukan.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const menuSummary = INITIAL_MENU_ITEMS.map((m) => ({
        id: m.id,
        name: m.name,
        resto: m.restaurant,
        price: m.price,
        taste: m.tasteCategory,
        desc: m.description
      }));

      const prompt = `Anda adalah asisten kuliner ramah di platform MakanDulu (ekosistem kuliner Indonesia).
Pertanyaan pengguna: "${query}".
Berikut daftar hidangan yang tersedia:
${JSON.stringify(menuSummary)}

Tolong berikan rekomendasi menu terbaik dalam bahasa Indonesia yang menggugah selera, sopan, dan hangat.
Keluarkan output murni JSON berformat:
{
  "explanation": "penjelasan Anda untuk pengguna",
  "recommendedMenuIds": ["id1", "id2"]
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const responseText = aiResponse.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const matchedItems = INITIAL_MENU_ITEMS.filter((item) =>
          parsed.recommendedMenuIds?.includes(item.id)
        );

        return res.json({
          success: true,
          explanation: parsed.explanation,
          recommendedItems: matchedItems
        });
      }
    } catch (err: any) {
      console.warn('[Gemini Server Error]', err.message);
    }
  }

  // Heuristic Fallback bila API key tidak aktif
  const queryLower = (query as string).toLowerCase();
  const matched = INITIAL_MENU_ITEMS.filter((m) => {
    if (queryLower.includes('pedas') && m.tasteCategory.includes('pedas')) return true;
    if (queryLower.includes('hemat') && m.price <= 40000) return true;
    if (queryLower.includes('bebek') && m.name.toLowerCase().includes('bebek')) return true;
    if (queryLower.includes('ayam') && m.name.toLowerCase().includes('ayam')) return true;
    return false;
  });

  return res.json({
    success: true,
    explanation: 'Berikut hidangan terbaik dari mitra MakanDulu yang cocok dengan selera rasa Anda:',
    recommendedItems: matched.length > 0 ? matched.slice(0, 3) : INITIAL_MENU_ITEMS.slice(0, 2)
  });
});

// Menyajikan build file Vite di lingkungan produksi
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('MakanDulu API Server berjalan. Silakan jalankan `npm run dev` untuk antarmuka web.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MakanDulu Server berjalan pada http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
});
