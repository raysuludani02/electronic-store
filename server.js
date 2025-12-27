import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'products.json');

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

// --- FUNGSI BANTUAN ---
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error reading DB:", err);
    return [];
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API ENDPOINTS ---

// 1. Ambil Semua Produk
app.get('/api/products', (req, res) => {
  const products = readDB();
  res.json(products);
});

// 2. Tambah Produk Baru
app.post('/api/products', authenticate, (req, res) => {
  try {
    const products = readDB();
    const newProduct = {
      id: Date.now(), // ID unik berdasarkan timestamp
      ...req.body
    };
    products.push(newProduct);
    writeDB(products);
    console.log("Produk ditambahkan:", newProduct.name);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Gagal menambah produk:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 3. Update Produk (Stok, Harga, dll)
app.put('/api/products/:id', authenticate, (req, res) => {
  const products = readDB();
  const { id } = req.params;
  const index = products.findIndex(p => p.id == id);

  if (index !== -1) {
    products[index] = { ...products[index], ...req.body };
    writeDB(products);
    res.json(products[index]);
  } else {
    res.status(404).json({ message: "Produk tidak ditemukan" });
  }
});

// 4. Hapus Produk
app.delete('/api/products/:id', authenticate, (req, res) => {
  const products = readDB();
  const { id } = req.params;
  console.log("Mencoba menghapus produk ID:", id);
  const newProducts = products.filter(p => String(p.id) !== id);
  
  if (products.length !== newProducts.length) {
    writeDB(newProducts);
    res.json({ message: "Produk berhasil dihapus" });
  } else {
    console.log("Gagal menghapus: ID tidak ditemukan");
    res.status(404).json({ message: "Produk tidak ditemukan" });
  }
});

// --- SERVE FRONTEND (STATIC FILES) ---
// Bagian ini membuat server bisa menampilkan hasil build React
app.use(express.static(path.join(__dirname, 'dist')));

// Jika rute tidak dikenali (bukan API), kirim file index.html React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});