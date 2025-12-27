import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- KONEKSI DATABASE (MONGODB) ---
// Kita akan mengambil URL dari Environment Variable di Vercel
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false; // Cache koneksi untuk Vercel

const connectDB = async () => {
  if (isConnected) return;
  if (!MONGODB_URI) return console.error("MONGODB_URI belum disetting!");
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ Berhasil terhubung ke MongoDB");
  } catch (err) {
    console.error("❌ Gagal koneksi MongoDB:", err);
  }
};

// --- SCHEMA DATABASE ---
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // ID Timestamp
  name: String,
  category: String,
  image: String,
  otherImages: String,
  condition: String,
  desc: String,
  variants: [{
    name: String,
    price: Number,
    stock: Number
  }],
  images: [String]
});

const Product = mongoose.model('Product', productSchema);

app.use(cors());
app.use(express.json());

// --- KEAMANAN SEDERHANA ---
const ADMIN_PASSWORD = "@Ray124102";

const authenticate = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: "Password Admin Salah!" });
  }
};

// --- API ENDPOINTS ---

// 1. Ambil Semua Produk
app.get('/api/products', async (req, res) => {
  await connectDB();
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

// 2. Tambah Produk Baru
app.post('/api/products', authenticate, async (req, res) => {
  await connectDB();
  try {
    const newProduct = new Product({
      id: Date.now(), // ID unik berdasarkan timestamp
      ...req.body
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Update Produk (Stok, Harga, dll)
app.put('/api/products/:id', authenticate, async (req, res) => {
  await connectDB();
  try {
    const { id } = req.params;
    const updated = await Product.findOneAndUpdate({ id: Number(id) }, req.body, { new: true });
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ message: "Produk tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Hapus Produk
app.delete('/api/products/:id', authenticate, async (req, res) => {
  await connectDB();
  try {
    const { id } = req.params;
    const deleted = await Product.findOneAndDelete({ id: Number(id) });
    if (deleted) {
      res.json({ message: "Produk berhasil dihapus" });
    } else {
      res.status(404).json({ message: "Produk tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- SERVE FRONTEND (STATIC FILES) ---
// Bagian ini membuat server bisa menampilkan hasil build React
app.use(express.static(path.join(__dirname, 'dist')));
// --- KONFIGURASI SERVER ---

// Jika rute tidak dikenali (bukan API), kirim file index.html React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// Export app untuk Vercel (Serverless)
export default app;

// Jalankan server manual HANYA jika bukan di Vercel (Localhost)
if (!process.env.VERCEL) {
  // Koneksi DB dulu baru jalanin server
  connectDB().then(() => {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
    
    app.listen(PORT, () => {
      console.log(`Server Backend berjalan di http://localhost:${PORT}`);
    });
  });
}