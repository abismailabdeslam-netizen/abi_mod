import { useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Palette,
} from "lucide-react";
import trpc from "@/lib/trpc";

// Color name to hex mapping
const COLOR_PRESETS = [
  { name: "أبيض", nameEn: "White", hex: "#FFFFFF" },
  { name: "أسود", nameEn: "Black", hex: "#000000" },
  { name: "أحمر", nameEn: "Red", hex: "#EF4444" },
  { name: "أزرق", nameEn: "Blue", hex: "#3B82F6" },
  { name: "أخضر", nameEn: "Green", hex: "#22C55E" },
  { name: "أصفر", nameEn: "Yellow", hex: "#EAB308" },
  { name: "برتقالي", nameEn: "Orange", hex: "#F97316" },
  { name: "وردي", nameEn: "Pink", hex: "#EC4899" },
  { name: "بنفسجي", nameEn: "Purple", hex: "#A855F7" },
  { name: "رمادي", nameEn: "Gray", hex: "#6B7280" },
  { name: "بني", nameEn: "Brown", hex: "#92400E" },
  { name: "بيج", nameEn: "Beige", hex: "#D2B48C" },
  { name: "كريمي", nameEn: "Cream", hex: "#FFFDD0" },
  { name: "تركواز", nameEn: "Turquoise", hex: "#06B6D4" },
  { name: "ذهبي", nameEn: "Gold", hex: "#D97706" },
  { name: "فضي", nameEn: "Silver", hex: "#9CA3AF" },
];

interface ColorEntry {
  name: string;
  hex: string;
}

interface ProductForm {
  id?: number;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionAr: string;
  price: string;
  oldPrice: string;
  costPrice: string;
  stockQuantity: number;
  categoryId: number;
  shippingProfileId: number;
  images: string[];
  colors: ColorEntry[];
  sizes: string[];
  isActive: boolean;
  isFeatured: boolean;
}

const emptyForm: ProductForm = {
  nameEn: "",
  nameFr: "",
  nameAr: "",
  descriptionEn: "",
  descriptionFr: "",
  descriptionAr: "",
  price: "",
  oldPrice: "",
  costPrice: "",
  stockQuantity: 0,
  categoryId: 0,
  shippingProfileId: 0,
  images: [],
  colors: [],
  sizes: [],
  isActive: true,
  isFeatured: false,
};

function parseColors(raw: unknown): ColorEntry[] {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } })()
    : [];
  return arr.map((c) => {
    if (typeof c === "object" && c !== null && "name" in c && "hex" in c) {
      return c as ColorEntry;
    }
    // Legacy: plain string color
    const name = String(c);
    const preset = COLOR_PRESETS.find((p) => p.nameEn.toLowerCase() === name.toLowerCase() || p.hex.toLowerCase() === name.toLowerCase());
    return { name: preset?.name ?? name, hex: preset?.hex ?? "#cccccc" };
  });
}

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [colorHex, setColorHex] = useState("#000000");
  const [colorName, setColorName] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [selectedProductImages, setSelectedProductImages] = useState<string[] | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data } = trpc.product.adminList.useQuery({ page, limit: 20, search: search || undefined });
  const { data: categories } = trpc.category.list.useQuery();
  const { data: shippingProfiles } = trpc.shippingProfile.list.useQuery();

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); setShowForm(false); setForm(emptyForm); },
  });
  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); setShowForm(false); setForm(emptyForm); },
  });
  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const colorsForApi = form.colors.map((c) => JSON.stringify(c));
    const payload = {
      nameEn: form.nameEn,
      nameFr: form.nameFr || undefined,
      nameAr: form.nameAr || undefined,
      descriptionEn: form.descriptionEn || undefined,
      descriptionFr: form.descriptionFr || undefined,
      descriptionAr: form.descriptionAr || undefined,
      price: form.price,
      oldPrice: form.oldPrice || undefined,
      costPrice: form.costPrice || undefined,
      stockQuantity: form.stockQuantity,
      categoryId: form.categoryId || undefined,
      shippingProfileId: form.shippingProfileId || undefined,
      images: form.images,
      colors: colorsForApi,
      sizes: form.sizes,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    if (form.id) {
      updateProduct.mutate({ id: form.id, ...payload });
    } else {
      createProduct.mutate(payload);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 800, 0.75);
      setForm((prev) => ({ ...prev, images: [...prev.images, compressed] }));
    } catch {
      // fallback raw
      const reader = new FileReader();
      reader.onload = (e) => setForm((prev) => ({ ...prev, images: [...prev.images, e.target?.result as string] }));
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  function compressImage(file: File, maxPx: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  const addImageUrl = () => {
    if (imageUrl && !form.images.includes(imageUrl)) {
      setForm({ ...form, images: [...form.images, imageUrl] });
      setImageUrl("");
    }
  };

  const addColor = () => {
    const name = colorName.trim() || COLOR_PRESETS.find((p) => p.hex.toLowerCase() === colorHex.toLowerCase())?.name || colorHex;
    const entry: ColorEntry = { name, hex: colorHex };
    if (!form.colors.some((c) => c.hex === colorHex)) {
      setForm({ ...form, colors: [...form.colors, entry] });
    }
    setColorName("");
    setShowColorPicker(false);
  };

  const addSize = () => {
    if (sizeInput && !form.sizes.includes(sizeInput)) {
      setForm({ ...form, sizes: [...form.sizes, sizeInput] });
      setSizeInput("");
    }
  };

  const parseImages = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; } catch { return raw ? [raw] : []; }
    }
    return [];
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...form.images];
    if (direction === "up" && index > 0) {
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    } else if (direction === "down" && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }
    setForm({ ...form, images: newImages });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">المنتجات / Products</h1>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="inline-flex items-center gap-2 h-10 px-4 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-5 py-3 font-semibold">Category</th>
                <th className="text-left px-5 py-3 font-semibold">Price</th>
                <th className="text-left px-5 py-3 font-semibold">Stock</th>
                <th className="text-left px-5 py-3 font-semibold">Colors</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.products.map((product) => {
                const images = parseImages(product.images);
                const colors = parseColors(product.colors);
                const cat = categories?.find((c) => c.id === product.categoryId);
                return (
                  <tr key={product.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={images[0] || ""}
                          alt={product.nameEn ?? ""}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedProductImages(images)}
                        />
                        <div>
                          <span className="font-medium text-gray-900 block">{product.nameEn}</span>
                          {product.nameAr && <span className="text-xs text-gray-400 block" dir="rtl">{product.nameAr}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{cat?.nameEn ?? "-"}</td>
                    <td className="px-5 py-3 font-medium">
                      {Number(product.price).toLocaleString()} DZD
                      {product.oldPrice && (
                        <span className="text-xs text-gray-400 line-through ml-1">{Number(product.oldPrice).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">{product.stockQuantity}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {colors.slice(0, 4).map((c, i) => (
                          <span key={i} title={c.name} className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                            <span className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{ background: c.hex }} />
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const p = product as unknown as Record<string, unknown>;
                            setForm({
                              id: product.id,
                              nameEn: product.nameEn ?? "",
                              nameFr: (p.nameFr as string) ?? "",
                              nameAr: (p.nameAr as string) ?? "",
                              descriptionEn: (p.descriptionEn as string) ?? "",
                              descriptionFr: (p.descriptionFr as string) ?? "",
                              descriptionAr: (p.descriptionAr as string) ?? "",
                              price: String(product.price),
                              oldPrice: product.oldPrice ? String(product.oldPrice) : "",
                              costPrice: product.costPrice ? String(product.costPrice) : "",
                              stockQuantity: product.stockQuantity ?? 0,
                              categoryId: product.categoryId ?? 0,
                              shippingProfileId: (p.shippingProfileId as number) ?? 0,
                              images: images,
                              colors: parseColors(product.colors),
                              sizes: parseImages(product.sizes),
                              isActive: product.isActive ?? true,
                              isFeatured: product.isFeatured ?? false,
                            });
                            setShowForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#0EA5B5] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this product?")) { deleteProduct.mutate({ id: product.id }); } }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {selectedProductImages && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedProductImages(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Product Images</h3>
              <button onClick={() => setSelectedProductImages(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedProductImages.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">{form.id ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Names */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN) *</label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Slug is auto-generated from this name</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (FR)</label>
                  <input type="text" value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (AR)</label>
                  <input type="text" dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
                  <textarea value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (AR)</label>
                  <textarea dir="rtl" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none" />
                </div>
              </div>

              {/* Category & Shipping */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none">
                    <option value={0}>Select...</option>
                    {categories?.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Profile</label>
                  <select value={form.shippingProfileId} onChange={(e) => setForm({ ...form, shippingProfileId: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none">
                    <option value={0}>Select profile...</option>
                    {shippingProfiles?.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (DZD) *</label>
                  <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Old Price</label>
                  <input type="text" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <input type="text" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none bg-amber-50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
              </div>

              {/* Images - Upload or URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                    placeholder="Paste image URL..."
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  />
                  <button type="button" onClick={addImageUrl} className="h-10 px-3 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Add URL</button>
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { Array.from(e.target.files ?? []).forEach(handleFileUpload); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="h-10 px-4 border-2 border-dashed border-[#0EA5B5] text-[#0EA5B5] rounded-lg text-sm hover:bg-[#E6F7F8] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Upload Images"}
                  </button>
                  <span className="text-xs text-gray-400">or drag & drop</span>
                </div>
                {form.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500">{form.images.length} image(s) — first is main</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {form.images.map((img, idx) => (
                        <div key={idx} className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${idx === 0 ? "border-[#0EA5B5]" : "border-gray-200"}`}>
                          <img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && <span className="absolute top-0 left-0 bg-[#0EA5B5] text-white text-[10px] px-1.5 py-0.5 rounded-br">Main</span>}
                          <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-3 h-3" /></button>
                          {idx > 0 && <button type="button" onClick={() => moveImage(idx, "up")} className="absolute bottom-0 left-0 bg-black/50 text-white p-0.5 rounded-tr"><ChevronLeft className="w-3 h-3" /></button>}
                          {idx < form.images.length - 1 && <button type="button" onClick={() => moveImage(idx, "down")} className="absolute bottom-0 right-0 bg-black/50 text-white p-0.5 rounded-tl"><ChevronRight className="w-3 h-3" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colors with Name + Hex */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colors (اللون + الاسم)</label>
                <div className="flex gap-2 items-center mb-2">
                  <div className="relative">
                    <input type="color" value={colorHex} onChange={(e) => { setColorHex(e.target.value); const preset = COLOR_PRESETS.find(p => p.hex.toLowerCase() === e.target.value.toLowerCase()); if (preset) setColorName(preset.name); }} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  </div>
                  <input
                    type="text"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="اسم اللون (مثال: أحمر)"
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  />
                  <button type="button" onClick={addColor} className="h-10 px-3 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1">
                    <Palette className="w-4 h-4" /> Add
                  </button>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COLOR_PRESETS.map((p) => (
                    <button key={p.hex} type="button" title={p.name}
                      onClick={() => { setColorHex(p.hex); setColorName(p.name); }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${colorHex === p.hex ? "border-[#0EA5B5] scale-110" : "border-gray-300"}`}
                      style={{ background: p.hex }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.colors.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg">
                      <span className="w-4 h-4 rounded-full border border-gray-300" style={{ background: c.hex }} />
                      {c.name}
                      <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sizes</label>
                <div className="flex gap-2">
                  <input type="text" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())} placeholder="Add size" className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
                  <button type="button" onClick={addSize} className="h-10 px-3 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.sizes.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-[#E6F7F8] text-[#0EA5B5] text-xs px-2 py-1 rounded-md">
                      {s}
                      <button type="button" onClick={() => setForm({ ...form, sizes: form.sizes.filter((x) => x !== s) })}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#0EA5B5] focus:ring-[#0EA5B5]" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#0EA5B5] focus:ring-[#0EA5B5]" />
                  Featured
                </label>
              </div>

              {(createProduct.error || updateProduct.error) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  Error: {(createProduct.error ?? updateProduct.error)?.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1 h-11 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50"
                >
                  {createProduct.isPending || updateProduct.isPending ? "Saving..." : form.id ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="h-11 px-6 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
