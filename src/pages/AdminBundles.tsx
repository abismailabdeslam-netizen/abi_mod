import { useState } from "react";
import {
  Plus,
  Trash2,
  Search,
  X,
  Package,
  Tag,
  Check,
} from "lucide-react";
import trpc from "@/lib/trpc";

interface BundleForm {
  id?: number;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  descriptionEn: string;
  bundlePrice: string;
  originalTotalPrice: string;
  image: string;
  selectedProductIds: number[];
  isActive: boolean;
}

const emptyForm: BundleForm = {
  nameEn: "",
  nameFr: "",
  nameAr: "",
  slug: "",
  descriptionEn: "",
  bundlePrice: "",
  originalTotalPrice: "",
  image: "",
  selectedProductIds: [],
  isActive: true,
};

export default function AdminBundles() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BundleForm>(emptyForm);
  const [productSearch, setProductSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: bundles, isLoading } = trpc.bundle.adminList.useQuery();
  const { data: products } = trpc.product.adminList.useQuery({
    page: 1,
    limit: 100,
    search: productSearch || undefined,
  });

  const createBundle = trpc.bundle.create.useMutation({
    onSuccess: () => {
      utils.bundle.adminList.invalidate();
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const deleteBundle = trpc.bundle.delete.useMutation({
    onSuccess: () => {
      utils.bundle.adminList.invalidate();
    },
  });

  const toggleProductSelection = (productId: number) => {
    setForm((prev) => {
      const exists = prev.selectedProductIds.includes(productId);
      return {
        ...prev,
        selectedProductIds: exists
          ? prev.selectedProductIds.filter((id) => id !== productId)
          : [...prev.selectedProductIds, productId],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const autoSlug = form.nameEn.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    createBundle.mutate({
      nameEn: form.nameEn,
      nameFr: form.nameFr || undefined,
      nameAr: form.nameAr || undefined,
      slug: autoSlug || form.nameEn,
      descriptionEn: form.descriptionEn || undefined,
      bundlePrice: form.bundlePrice,
      originalTotalPrice: form.originalTotalPrice || undefined,
      image: form.image || undefined,
      productIds: form.selectedProductIds,
      isActive: form.isActive,
    });
  };

  const parseImages = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [raw];
      } catch {
        return raw ? [raw] : [];
      }
    }
    return [];
  };

  // Calculate original total from selected products
  const selectedProductsTotal =
    products?.products
      .filter((p) => form.selectedProductIds.includes(p.id))
      .reduce((sum, p) => sum + Number(p.price), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bundles & Sets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create product bundles at discounted prices
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Bundle
        </button>
      </div>

      {/* Bundles List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-48"
            />
          ))}
        </div>
      ) : bundles && bundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Bundle Image */}
              <div className="aspect-video bg-gray-100 relative">
                {bundle.image ? (
                  <img
                    src={bundle.image}
                    alt={bundle.nameEn ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {bundle.originalTotalPrice && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {Math.round(
                      (1 - Number(bundle.bundlePrice) / Number(bundle.originalTotalPrice)) * 100
                    )}
                    % OFF
                  </div>
                )}
              </div>

              {/* Bundle Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {bundle.nameEn}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {bundle.items?.length ?? 0} products
                </p>

                {/* Products in bundle */}
                <div className="space-y-2 mb-4">
                  {(bundle.items ?? []).slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <img
                        src={parseImages(item.productImage)[0] ?? ""}
                        alt={item.productName ?? ""}
                        className="w-8 h-8 rounded object-cover bg-gray-100"
                      />
                      <span className="text-gray-700 flex-1 truncate">
                        {item.productName}
                      </span>
                    </div>
                  ))}
                  {(bundle.items?.length ?? 0) > 3 && (
                    <p className="text-xs text-gray-400">
                      +{(bundle.items!.length - 3)} more products
                    </p>
                  )}
                </div>

                {/* Prices */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    {bundle.originalTotalPrice && (
                      <p className="text-xs text-gray-400 line-through">
                        {Number(bundle.originalTotalPrice).toLocaleString()} DZD
                      </p>
                    )}
                    <p className="text-lg font-bold text-[#0EA5B5]">
                      {Number(bundle.bundlePrice).toLocaleString()} DZD
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this bundle?")) {
                        deleteBundle.mutate({ id: bundle.id });
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bundles yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first bundle to get started
          </p>
        </div>
      )}

      {/* Create Bundle Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Create Bundle</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Names */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundle Name (EN) *
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm({ ...form, nameEn: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (FR)
                  </label>
                  <input
                    type="text"
                    value={form.nameFr}
                    onChange={(e) =>
                      setForm({ ...form, nameFr: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (AR)
                  </label>
                  <input
                    type="text"
                    value={form.nameAr}
                    onChange={(e) =>
                      setForm({ ...form, nameAr: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Slug auto-generated — show as readonly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-gray-400 font-normal">(auto from EN name)</span>
                </label>
                <input
                  type="text"
                  value={form.nameEn
                    ? form.nameEn.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
                    : ""}
                  readOnly
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 outline-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                    placeholder="Paste URL or upload..."
                  />
                  <label className="h-10 px-3 border-2 border-dashed border-[#0EA5B5] text-[#0EA5B5] rounded-lg text-sm hover:bg-[#E6F7F8] transition-colors flex items-center gap-1 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.onload = () => {
                          URL.revokeObjectURL(url);
                          let { width, height } = img;
                          const maxPx = 800;
                          if (width > maxPx || height > maxPx) {
                            if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
                            else { width = Math.round(width * maxPx / height); height = maxPx; }
                          }
                          const canvas = document.createElement("canvas");
                          canvas.width = width; canvas.height = height;
                          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
                          setForm({ ...form, image: canvas.toDataURL("image/jpeg", 0.75) });
                        };
                        img.src = url;
                      }
                    }} />
                  </label>
                </div>
                {form.image && (
                  <img src={form.image} alt="preview" className="mt-2 w-24 h-24 rounded-xl object-cover border border-gray-200" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (EN)
                </label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionEn: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
                  <textarea value={(form as any).descriptionFr ?? ""} onChange={(e) => setForm({ ...form, ...{ descriptionFr: e.target.value } } as any)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (AR)</label>
                  <textarea dir="rtl" value={(form as any).descriptionAr ?? ""} onChange={(e) => setForm({ ...form, ...{ descriptionAr: e.target.value } } as any)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none" />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bundle Price (DZD) *
                  </label>
                  <input
                    type="text"
                    value={form.bundlePrice}
                    onChange={(e) =>
                      setForm({ ...form, bundlePrice: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Total Price
                  </label>
                  <input
                    type="text"
                    value={
                      form.originalTotalPrice ||
                      (selectedProductsTotal > 0
                        ? String(selectedProductsTotal)
                        : "")
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        originalTotalPrice: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                    placeholder="Auto-calculated from products"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Products * ({form.selectedProductIds.length}{" "}
                  selected)
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  />
                </div>
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {products?.products.map((product) => {
                    const images = parseImages(product.images);
                    const isSelected = form.selectedProductIds.includes(
                      product.id
                    );
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                          isSelected ? "bg-[#E6F7F8]" : ""
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-[#0EA5B5] border-[#0EA5B5]"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <img
                          src={images[0] ?? ""}
                          alt={product.nameEn ?? ""}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.nameEn}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Number(product.price).toLocaleString()} DZD
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected products summary */}
              {form.selectedProductIds.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Products Total:
                    </span>
                    <span className="text-sm">
                      {selectedProductsTotal.toLocaleString()} DZD
                    </span>
                  </div>
                  {form.bundlePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">
                        Customer Saves:
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {(
                          selectedProductsTotal - Number(form.bundlePrice)
                        ).toLocaleString()}{" "}
                        DZD
                      </span>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#0EA5B5] focus:ring-[#0EA5B5]"
                />
                Active
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    createBundle.isPending ||
                    form.selectedProductIds.length === 0
                  }
                  className="flex-1 h-11 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50"
                >
                  {createBundle.isPending ? "Creating..." : "Create Bundle"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-11 px-6 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
