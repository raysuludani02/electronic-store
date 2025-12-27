import React, { useState, useEffect } from 'react';
import './index.css';
import { 
  Search, ShoppingBag, Smartphone, Laptop, Zap, Star, Percent,
  CheckCircle, X, CreditCard, ArrowRight, MapPin, User, Phone, Home, Truck, ShieldCheck, Monitor, Minus, Plus, Settings, Save, Trash2, Edit, List, PlusCircle, ChevronLeft, ChevronRight, Copy
} from 'lucide-react';

function App() {
  // Force new deployment trigger
  // --- KONFIGURASI TOKO ---
  const shopConfig = {
    name: "GadgetStore Gorontalo",
    waNumber: "6289505401680", 
    bankAccounts: [
      { name: "DANA", number: "089505401680 (A.n MOH SYAFRI)" },
      { name: "BRI", number: "516001024896537 (A.n MOH SYAFRI)" }
    ]
  };

  const categories = [
    { id: 'all', label: 'Semua', icon: Zap },
    { id: 'ibox', label: 'iBox', icon: CheckCircle },
    { id: 'inter', label: 'Inter', icon: Smartphone },
    { id: 'beacukai', label: 'BC', icon: Smartphone },
    { id: 'macbook', label: 'Mac', icon: Laptop },
    { id: 'windows', label: 'Laptop', icon: Monitor },
  ];

  // --- STATE ---
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("BRI");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false); // Toggle Admin Panel
  const [adminPassword, setAdminPassword] = useState(""); // Simpan password admin
  const [adminView, setAdminView] = useState("list"); // 'list' | 'form'
  const [adminSearch, setAdminSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [buyerDetails, setBuyerDetails] = useState({
    nama: "", telepon: "", jalan: "", noRumah: "", alamatLengkap: "", kodePos: "", catatan: ""
  });
  
  // State untuk Form Tambah Produk
  const [newProduct, setNewProduct] = useState({
    name: "", category: "ibox", image: "", otherImages: [], condition: "Baru", desc: ""
  });
  // State untuk Varian (Minimal 1)
  const [newVariants, setNewVariants] = useState([
    { name: "", price: "", promoPrice: "", stock: "" }
  ]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // FETCH DATA DARI BACKEND
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
        setCurrentImageIndex(0);
    }
  }, [selectedProduct]);

  // LOGIKA INPUT VARIAN
  const handleVariantChange = (index, field, value) => {
    const updated = [...newVariants];
    updated[index][field] = value;
    setNewVariants(updated);
  };

  const addVariant = () => {
    setNewVariants([...newVariants, { name: "", price: "", promoPrice: "", stock: "" }]);
  };

  const removeVariant = (index) => {
    if (newVariants.length === 1) return alert("Minimal harus ada 1 varian!");
    const updated = newVariants.filter((_, i) => i !== index);
    setNewVariants(updated);
  };

  const resetForm = () => {
    setNewProduct({ name: "", category: "ibox", image: "", otherImages: [], condition: "Baru", desc: "" });
    setNewVariants([{ name: "", price: "", promoPrice: "", stock: "" }]);
    setEditingId(null);
  };

  const handleEditClick = (product) => {
    setNewProduct({
        name: product.name,
        category: product.category,
        image: product.image,
        otherImages: product.images && product.images.length > 1 ? product.images.slice(1) : [],
        condition: product.condition,
        desc: product.desc
    });
    // Pastikan varian ada, jika tidak buat default
    setNewVariants(product.variants && product.variants.length > 0 
        ? product.variants.map(v => ({ ...v, promoPrice: v.promoPrice || "" })) 
        : [{ name: "", price: "", promoPrice: "", stock: "" }]
    );
    setEditingId(product.id);
    setAdminView("form");
  };

  const handleDuplicateClick = (product) => {
    setNewProduct({
        name: `${product.name} (Copy)`,
        category: product.category,
        image: product.image,
        otherImages: product.images && product.images.length > 1 ? product.images.slice(1) : [],
        condition: product.condition,
        desc: product.desc
    });
    setNewVariants(product.variants && product.variants.length > 0 
        ? product.variants.map(v => ({ ...v, promoPrice: v.promoPrice || "" })) 
        : [{ name: "", price: "", promoPrice: "", stock: "" }]
    );
    setEditingId(null); // Reset ID agar tersimpan sebagai produk baru
    setAdminView("form");
  };

  const handleAdminToggle = () => {
    if (isAdminOpen) {
        setIsAdminOpen(false);
        setAdminPassword(""); // Reset password saat tutup
    } else {
        const pass = prompt("Masukkan Password Admin:");
        if (pass === "@Ray124102") {
            setAdminPassword(pass);
            setIsAdminOpen(true);
        } else if (pass !== null) {
            alert("Password Salah! Akses ditolak.");
        }
    }
  };

  // HANDLE UPLOAD GAMBAR (BASE64)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Batas 2MB
         alert("Ukuran gambar terlalu besar! Harap gunakan gambar di bawah 2MB.");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // HANDLE UPLOAD GAMBAR LAIN (MULTIPLE)
  const handleOtherImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then(base64Images => {
        setNewProduct(prev => ({
            ...prev,
            otherImages: [...prev.otherImages, ...base64Images]
        }));
    });
  };

  const removeOtherImage = (index) => {
      setNewProduct(prev => ({
          ...prev,
          otherImages: prev.otherImages.filter((_, i) => i !== index)
      }));
  };

  // HANDLE SIMPAN (TAMBAH / EDIT)
  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.image) return alert("Nama Produk dan Gambar Utama wajib diisi!");
    if (newVariants.some(v => !v.name || !v.price || !v.stock)) return alert("Mohon lengkapi semua data varian (Nama, Harga, Stok)!");

    setIsSaving(true);
    const formattedVariants = newVariants.map(v => ({ 
        ...v, 
        price: parseInt(v.price) || 0, 
        promoPrice: parseInt(v.promoPrice) || 0,
        stock: parseInt(v.stock) || 0 
    }));
    const imageList = [newProduct.image, ...newProduct.otherImages];

    const payload = {
        ...newProduct,
        variants: formattedVariants,
        images: imageList,
    };

    try {
        const url = editingId 
            ? `/api/products/${editingId}`
            : '/api/products';
        
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-password': adminPassword // Kirim password ke server
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        alert(`Produk berhasil ${editingId ? 'diupdate' : 'ditambahkan'}!`);
        fetchProducts(); // Refresh data
        resetForm();
        setAdminView("list");
    } catch (error) {
        console.error("Error saving product:", error);
        alert(`Gagal menyimpan produk: ${error.message}.`);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if(!window.confirm("Yakin ingin menghapus produk ini secara permanen?")) return;
    try {
        const response = await fetch(`/api/products/${id}`, { 
            method: 'DELETE',
            headers: { 
                'x-admin-password': adminPassword // Kirim password ke server
            }
        });
        if (response.ok) {
            alert("Produk berhasil dihapus!");
            fetchProducts();
        } else {
            alert("Gagal menghapus produk. Pastikan server backend sudah direstart (node server.js).");
        }
    } catch (error) {
        alert("Gagal menghapus produk (Koneksi Error).");
    }
  };

  const filteredProducts = products.filter(product => {
    let categoryMatch = true;
    if (activeCategory === "promo") {
        // Filter produk yang punya setidaknya 1 varian dengan harga promo valid
        categoryMatch = product.variants.some(v => v.promoPrice > 0 && v.promoPrice < v.price);
    } else if (activeCategory !== "all") {
        categoryMatch = product.category === activeCategory;
    }
    
    const searchMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

  const handleCheckout = () => {
    if (!selectedVariant) return alert("Pilih varian dulu ya kak!"); 
    if (selectedVariant.stock <= 0) return alert("Maaf, stok varian ini sedang habis.");
    if (!buyerDetails.nama || !buyerDetails.telepon || !buyerDetails.jalan) return alert("Mohon lengkapi data alamat utama!");

    setIsProcessing(true); // Mulai animasi loading pesanan

    setTimeout(() => {
        const bank = shopConfig.bankAccounts.find(b => b.name === paymentMethod);
        const paymentInfo = bank ? `${bank.name}: ${bank.number}` : "";

        // Cek apakah varian ini lagi promo
        const finalPrice = (selectedVariant.promoPrice && selectedVariant.promoPrice > 0 && selectedVariant.promoPrice < selectedVariant.price) 
            ? selectedVariant.promoPrice 
            : selectedVariant.price;

        const totalPrice = finalPrice * quantity;
        const message = `Halo Admin ${shopConfig.name}, saya mau pesan:\n\n🛍️ *${selectedProduct.name}*\n📦 Varian: ${selectedVariant.name}\n🔢 Jumlah: ${quantity}\n💰 Harga Satuan: ${formatRupiah(finalPrice)}\n💵 *Total: ${formatRupiah(totalPrice)}*\n\n📋 *DATA PENGIRIMAN*\n👤 Nama: ${buyerDetails.nama}\n📱 No HP: ${buyerDetails.telepon}\n🏠 Alamat: ${buyerDetails.jalan} No. ${buyerDetails.noRumah}\n📍 Detail: ${buyerDetails.alamatLengkap}\n📮 Kode Pos: ${buyerDetails.kodePos}\n📝 Catatan: ${buyerDetails.catatan || '-'}\n💳 Pembayaran: ${paymentMethod}\nℹ️ Rekening: ${paymentInfo}\n\nMohon cek ongkirnya min. Terima kasih!`;
        const url = `https://wa.me/${shopConfig.waNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        
        setIsProcessing(false); // Hentikan animasi
    }, 2000); // Delay 2 detik agar terlihat prosesnya
  };

  // TAMPILAN LOADING HALAMAN (SPLASH SCREEN)
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <div className="flex items-center gap-2 animate-pulse">
            <ShoppingBag className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">{shopConfig.name}</h2>
        </div>
        <p className="text-slate-400 text-sm mt-2">Memuat katalog terbaik...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      
      {/* OVERLAY LOADING PROSES PESANAN */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95">
                <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={20} className="text-blue-600 animate-pulse"/>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Memproses Pesanan...</h3>
                <p className="text-slate-500 text-sm text-center max-w-[200px]">Mohon tunggu, sedang menghubungkan ke WhatsApp.</p>
            </div>
        </div>
      )}
      
      {/* CSS untuk Animasi Floating Halus (Supaya gambar bergerak pelan) */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
      `}</style>

      {/* HEADER */}
      <header className="bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><ShoppingBag size={20} /></div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">{shopConfig.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setActiveCategory('promo'); document.getElementById('katalog').scrollIntoView({behavior: 'smooth'}); }} className="flex items-center gap-1 text-red-500 font-bold text-sm animate-pulse"><Percent size={16}/> Promo Spesial</button>
            <a href="#katalog" onClick={() => setActiveCategory('all')} className="text-blue-600 font-bold text-sm">Lihat Stok</a>
          </div>
        </div>
      </header>

      {/* HERO SECTION (MIRIP GAMBAR REFERENSI) */}
      <div className="bg-blue-600 relative overflow-hidden pb-20 pt-12 md:pb-32 md:pt-16 rounded-b-[2.5rem] md:rounded-b-[4rem]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          
          {/* Badge Trusted Seller */}
          <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-6 border border-white/20 shadow-lg">
            Trusted Seller • Gorontalo
          </span>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm leading-tight">
            Gadget Impian,<br/>Harga Teman.
          </h2>
          <p className="text-blue-100 text-sm md:text-lg mb-8 md:mb-10 max-w-2xl px-4">
            Jasa Dropship iPhone, MacBook, Pixel & Laptop Second Murah Berkualitas & Bergaransi.
          </p>

          {/* Search Bar Besar */}
          <div className="w-full max-w-xl relative px-4 md:px-0">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-blue-200" size={24} />
            </div>
            <input 
              type="text" 
              placeholder="Cari iPhone, Dell, Pixel..." 
              className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl py-4 pl-14 pr-4 text-white placeholder:text-blue-200 focus:outline-none focus:bg-white/30 transition shadow-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>

        {/* --- DEKORASI IPHONE KIRI (FLOATING) --- */}
        <div className="hidden lg:block absolute top-32 left-[2%] animate-float pointer-events-none">
           <img 
             src="/hover.png" 
             alt="iPhone Left" 
             className="w-80 transform -rotate-12 drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] opacity-100"
             onError={(e) => e.target.src = "https://pngimg.com/d/iphone_14_PNG2.png"}
           />
           {/* Glass Card Kiri */}
           <div className="absolute top-20 right-[-20px] bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl w-48 animate-pulse">
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2">
                <CheckCircle className="text-blue-600" size={18}/>
              </div>
              <h4 className="text-white font-bold text-lg leading-tight mb-1">Garansi IMEI <br/>& Unit Aman</h4>
              <p className="text-blue-100 text-[10px]">Barang akan kami QC sebelum pengiriman, di jamin aman.</p>
           </div>
        </div>

        {/* --- DEKORASI IPHONE KANAN (FLOATING) --- */}
        <div className="hidden lg:block absolute top-10 right-[2%] animate-float-delayed pointer-events-none">
           <img 
             src="/hover.png" 
             alt="iPhone Right" 
             className="w-80 transform rotate-12 drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] opacity-100"
             onError={(e) => e.target.src = "https://assets.stickpng.com/images/580b57fcd9996e24bc43c51f.png"}
           />
           {/* Glass Card Kanan */}
           <div className="absolute top-20 left-[-40px] bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl w-48 animate-pulse">
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mb-2">
                <CheckCircle className="text-blue-600" size={18}/>
              </div>
              <h4 className="text-white font-bold text-lg leading-tight mb-1">Garansi IMEI <br/>& Unit Aman</h4>
              <p className="text-blue-100 text-[10px]">Barang akan kami QC sebelum pengiriman, di jamin aman.</p>
           </div>
        </div>
      </div>

      {/* FILTER BUTTONS (FLOATING OVERLAP) */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20" id="katalog">
        <div className="bg-white p-3 rounded-2xl shadow-xl flex gap-3 overflow-x-auto no-scrollbar justify-start md:justify-center border border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-lg transform scale-105' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <cat.icon size={18} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 md:mt-16 pb-20">
        {activeCategory === 'promo' && (
            <div className="mb-6 flex items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-800">🔥 Sedang Promo</h3>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">{filteredProducts.length} Produk</span>
            </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map((product) => {
            // Cek apakah produk ini punya varian promo untuk display harga
            const promoVariant = product.variants.find(v => v.promoPrice > 0 && v.promoPrice < v.price);
            const displayPrice = promoVariant ? promoVariant.promoPrice : product.variants[0].price;
            const originalPrice = promoVariant ? promoVariant.price : null;

            return (
             <div 
              key={product.id} 
              onClick={() => { setSelectedProduct(product); setSelectedVariant(product.variants[0]); setQuantity(1); }}
              className="bg-white rounded-3xl p-4 shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
            >
              <div className="bg-slate-50 rounded-2xl mb-4 overflow-hidden aspect-[4/5] relative flex items-center justify-center">
                 <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" onError={(e) => {e.target.src = "https://placehold.co/400x500/f1f5f9/334155?text=Gadget"}}/>
                 <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">
                   {product.condition}
                 </div>
                 {promoVariant && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm animate-pulse">
                        PROMO
                    </div>
                 )}
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-2 line-clamp-2">{product.desc}</p>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    {originalPrice && <span className="text-xs text-slate-400 line-through">{formatRupiah(originalPrice)}</span>}
                    <span className={`text-lg font-extrabold ${promoVariant ? 'text-red-600' : 'text-slate-900'}`}>{formatRupiah(displayPrice)}</span>
                  </div>
                  <div className="bg-slate-900 text-white p-2 rounded-lg group-hover:bg-blue-600 transition"><ArrowRight size={16}/></div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POPUP (FORM LENGKAP) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 overflow-y-auto md:overflow-hidden">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 z-20 p-2 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>

            {/* Kiri: Ringkasan */}
            <div className="w-full md:w-5/12 bg-slate-50 p-6 md:p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-200 shrink-0 md:h-full md:overflow-y-auto">
               
               {/* SLIDER GAMBAR */}
               <div className="relative mb-6 group">
                   <img src={(selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image])[currentImageIndex]} className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-lg bg-white" onError={(e) => {e.target.src = "https://placehold.co/400x400/EEE/999?text=Produk"}}/>
                   {(selectedProduct.images && selectedProduct.images.length > 1) && (
                       <>
                           <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? selectedProduct.images.length - 1 : prev - 1)); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow-sm hover:bg-white text-slate-800 transition"><ChevronLeft size={20}/></button>
                           <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === selectedProduct.images.length - 1 ? 0 : prev + 1)); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow-sm hover:bg-white text-slate-800 transition"><ChevronRight size={20}/></button>
                           <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                               {selectedProduct.images.map((_, idx) => (
                                   <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                               ))}
                           </div>
                       </>
                   )}
               </div>

               <h3 className="font-bold text-slate-900 text-xl md:text-2xl leading-tight mb-2">{selectedProduct.name}</h3>
               
               {/* Harga di Modal */}
               <div className="mb-6">
                   {selectedVariant && selectedVariant.promoPrice > 0 && selectedVariant.promoPrice < selectedVariant.price ? (
                       <div className="flex flex-col items-center">
                           <span className="text-sm text-slate-400 line-through">{formatRupiah(selectedVariant.price)}</span>
                           <span className="text-red-600 font-extrabold text-2xl md:text-3xl">{formatRupiah(selectedVariant.promoPrice)}</span>
                           <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">Hemat {formatRupiah(selectedVariant.price - selectedVariant.promoPrice)}</span>
                       </div>
                   ) : (
                       <p className="text-blue-600 font-extrabold text-2xl md:text-3xl">{selectedVariant ? formatRupiah(selectedVariant.price) : '-'}</p>
                   )}
               </div>

               <div className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-400 mb-2 font-bold uppercase">Pilih Varian:</p>
                 <div className="flex flex-wrap gap-2">
                   {selectedProduct.variants.map((v, i) => (
                     <button 
                        key={i} 
                        onClick={() => { setSelectedVariant(v); setQuantity(1); }} 
                        className={`text-xs px-3 py-2 rounded-lg font-bold border transition relative ${selectedVariant === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                     >
                        {v.name}
                        {v.promoPrice > 0 && v.promoPrice < v.price && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                     </button>
                   ))}
                 </div>
                 
                 {/* Stok & Quantity */}
                 <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Stok Tersedia</p>
                        <p className={`text-sm font-bold ${selectedVariant?.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {selectedVariant?.stock > 0 ? `${selectedVariant.stock} Unit` : 'Stok Habis'}
                        </p>
                    </div>
                    {selectedVariant?.stock > 0 && (
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:bg-white rounded-md transition"><Minus size={14}/></button>
                            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))} className="p-1 hover:bg-white rounded-md transition"><Plus size={14}/></button>
                        </div>
                    )}
                 </div>
               </div>
            </div>

            {/* Kanan: Form */}
            <div className="w-full md:w-7/12 p-6 md:p-8 bg-white md:h-full md:overflow-y-auto">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg"><Truck size={20} className="text-blue-600"/> Data Pengiriman</h3>
              <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-bold text-slate-400 ml-1">Nama</label><div className="flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200"><User size={14} className="text-slate-400"/><input type="text" className="bg-transparent w-full p-2.5 text-sm outline-none" placeholder="Budi" value={buyerDetails.nama} onChange={(e) => setBuyerDetails({...buyerDetails, nama: e.target.value})} /></div></div>
                      <div><label className="text-[10px] font-bold text-slate-400 ml-1">WhatsApp</label><div className="flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200"><Phone size={14} className="text-slate-400"/><input type="number" className="bg-transparent w-full p-2.5 text-sm outline-none" placeholder="08xx" value={buyerDetails.telepon} onChange={(e) => setBuyerDetails({...buyerDetails, telepon: e.target.value})} /></div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 ml-1">Jalan</label><div className="flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200"><Home size={14} className="text-slate-400"/><input type="text" className="bg-transparent w-full p-2.5 text-sm outline-none" placeholder="Jl. Mawar" value={buyerDetails.jalan} onChange={(e) => setBuyerDetails({...buyerDetails, jalan: e.target.value})} /></div></div>
                     <div><label className="text-[10px] font-bold text-slate-400 ml-1">No. Rumah</label><input type="text" className="w-full bg-slate-50 rounded-xl p-2.5 text-sm border border-slate-200 outline-none text-center" placeholder="12A" value={buyerDetails.noRumah} onChange={(e) => setBuyerDetails({...buyerDetails, noRumah: e.target.value})} /></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-400 ml-1">Detail (RT/RW, Kel, Kec)</label><textarea className="w-full bg-slate-50 rounded-xl p-3 text-sm border border-slate-200 outline-none" rows="2" placeholder="RT 05 RW 02, Kel. X, Kec. Y..." value={buyerDetails.alamatLengkap} onChange={(e) => setBuyerDetails({...buyerDetails, alamatLengkap: e.target.value})}></textarea></div>
                  <div><label className="text-[10px] font-bold text-slate-400 ml-1">Kode Pos</label><input type="number" className="w-1/3 bg-slate-50 rounded-xl p-2.5 text-sm border border-slate-200 outline-none" placeholder="96xxx" value={buyerDetails.kodePos} onChange={(e) => setBuyerDetails({...buyerDetails, kodePos: e.target.value})} /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 ml-1">Catatan Pesanan (Opsional)</label><textarea className="w-full bg-slate-50 rounded-xl p-3 text-sm border border-slate-200 outline-none" rows="2" placeholder="Warna cadangan, pesan khusus, dll..." value={buyerDetails.catatan} onChange={(e) => setBuyerDetails({...buyerDetails, catatan: e.target.value})}></textarea></div>
              </div>
              <div className="mt-4">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">Metode Pembayaran</label>
                  <select className="w-full bg-slate-50 rounded-xl p-2.5 text-sm border border-slate-200 outline-none" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      {shopConfig.bankAccounts.map((bank, idx) => (
                          <option key={idx} value={bank.name}>Transfer {bank.name}</option>
                      ))}
                  </select>
              </div>
              <button 
                onClick={handleCheckout} 
                disabled={!selectedVariant || selectedVariant.stock <= 0}
                className={`w-full mt-8 text-white py-4 rounded-xl font-bold shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 ${!selectedVariant || selectedVariant.stock <= 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
              >
                {selectedVariant?.stock > 0 ? 'Pesan Sekarang' : 'Stok Habis'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center text-slate-400 text-xs pb-8">
        <p>&copy; 2025 {shopConfig.name}. Amanah & Terpercaya.</p>
        <button onClick={handleAdminToggle} className="mt-4 text-slate-300 hover:text-blue-600 flex items-center gap-1 mx-auto">
            <Settings size={12}/> {isAdminOpen ? 'Tutup Admin' : 'Admin Mode'}
        </button>
      </footer>

      {/* ADMIN PANEL (SEDERHANA) */}
      {isAdminOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
            <div className="max-w-5xl mx-auto p-4 md:p-6">
                
                {/* ADMIN HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800"><Settings size={24}/> Panel Admin</h3>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button onClick={() => setAdminView("list")} className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition ${adminView === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><List size={14}/> Kelola Produk</button>
                            <button onClick={() => { resetForm(); setAdminView("form"); }} className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition ${adminView === 'form' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><PlusCircle size={14}/> Tambah Baru</button>
                        </div>
                    </div>
                    <button onClick={() => setIsAdminOpen(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
                </div>

                {/* VIEW: LIST PRODUK */}
                {adminView === "list" && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari produk yang tersimpan..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                            {products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase())).map((product) => (
                                <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition gap-3">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <img src={product.image} className="w-12 h-12 rounded-lg object-cover bg-slate-100" onError={(e) => e.target.src = "https://placehold.co/100"} />
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800">{product.name}</h4>
                                            <p className="text-xs text-slate-500">{product.variants.length} Varian • Stok Total: {product.variants.reduce((a,b) => a + parseInt(b.stock), 0)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        <button onClick={() => handleDuplicateClick(product)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition" title="Duplikat"><Copy size={16}/></button>
                                        <button onClick={() => handleEditClick(product)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteClick(product.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Belum ada produk.</p>}
                        </div>
                    </div>
                )}

                {/* VIEW: FORM INPUT */}
                {adminView === "form" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* KOLOM KIRI: INFO UTAMA */}
                    <div className="md:col-span-1 space-y-4">
                        <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">1. Informasi Produk</h4>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nama Produk</label>
                            <input type="text" placeholder="Contoh: iPhone 13 Pro" className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                            <select className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Kondisi</label>
                            <input type="text" placeholder="Baru / Second Mulus / Like New" className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Singkat</label>
                            <textarea placeholder="Keterangan garansi, kelengkapan, dll..." className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" rows="3" value={newProduct.desc} onChange={e => setNewProduct({...newProduct, desc: e.target.value})}></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Upload Gambar Utama</label>
                            <div className="flex flex-col gap-2">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                {newProduct.image && (
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                                        <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button onClick={() => setNewProduct({...newProduct, image: ""})} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition" title="Hapus Gambar"><Trash2 size={16}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Gambar Lain (Opsional)</label>
                            <div className="flex flex-col gap-2">
                                <input type="file" accept="image/*" multiple onChange={handleOtherImagesUpload} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                <div className="flex flex-wrap gap-2">
                                    {newProduct.otherImages.map((img, idx) => (
                                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 group">
                                            <img src={img} alt={`Other ${idx}`} className="w-full h-full object-cover" />
                                            <button onClick={() => removeOtherImage(idx)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><X size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN: VARIAN */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-end">
                            <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">2. Varian & Harga</h4>
                            <button onClick={addVariant} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-200 transition flex items-center gap-1"><Plus size={14}/> Tambah Varian</button>
                        </div>
                        
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {newVariants.map((variant, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-3 sm:items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="w-full sm:flex-1">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Varian</label>
                                        <input type="text" placeholder="Ex: 128GB, Merah" className="w-full border border-slate-300 p-2 rounded-lg text-sm" value={variant.name} onChange={e => handleVariantChange(index, 'name', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <div className="flex-1 sm:w-24">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Harga</label>
                                            <input type="number" placeholder="0" className="w-full border border-slate-300 p-2 rounded-lg text-sm" value={variant.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} />
                                        </div>
                                        <div className="flex-1 sm:w-24">
                                            <label className="block text-[10px] font-bold text-red-400 mb-1">Promo</label>
                                            <input type="number" placeholder="0" className="w-full border border-red-200 bg-red-50 p-2 rounded-lg text-sm text-red-600" value={variant.promoPrice} onChange={e => handleVariantChange(index, 'promoPrice', e.target.value)} />
                                        </div>
                                        <div className="flex-1 sm:w-20">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Stok</label>
                                            <input type="number" placeholder="0" className="w-full border border-slate-300 p-2 rounded-lg text-sm" value={variant.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} />
                                        </div>
                                    </div>
                                    <button onClick={() => removeVariant(index)} className="p-2.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-4">
                             <button onClick={handleSaveProduct} disabled={isSaving} className={`w-full text-white py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                {isSaving ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Menyimpan...</>
                                ) : (
                                    <><Save size={18}/> {editingId ? 'Update Produk' : 'Simpan Produk Baru'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;