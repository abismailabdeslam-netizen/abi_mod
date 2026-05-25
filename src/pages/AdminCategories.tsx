import { useState } from "react";
import { Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import trpc from "@/lib/trpc";

interface CategoryForm {
  id?: number;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  descriptionEn: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: CategoryForm = {
  nameEn: "",
  nameFr: "",
  nameAr: "",
  descriptionEn: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminCategories() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: categories } = trpc.category.list.useQuery();

  const createCategory = trpc.category.create.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      resetForm();
    },
  });

  const updateCategory = trpc.category.update.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      resetForm();
    },
  });

  const deleteCategory = trpc.category.delete.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nameEn: form.nameEn,
      nameFr: form.nameFr || undefined,
      nameAr: form.nameAr || undefined,
      descriptionEn: form.descriptionEn || undefined,
      image: form.image || undefined,
      sortOrder: form.sortOrder,
    };

    if (editId) {
      updateCategory.mutate({ id: editId, ...payload });
    } else {
      createCategory.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.nameEn ?? ""}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-50 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#E6F7F8] flex items-center justify-center shrink-0">
                    <ImagePlus className="w-6 h-6 text-[#0EA5B5]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">
                    {category.nameEn}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {category.productCount} products
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => {
                        setEditId(category.id);
                        setForm({
                          id: category.id,
                          nameEn: category.nameEn ?? "",
                          nameFr: (category as any).nameFr ?? "",
                          nameAr: (category as any).nameAr ?? "",
                          descriptionEn:
                            (category as any).descriptionEn ?? "",
                          image: category.image ?? "",
                          sortOrder: category.sortOrder ?? 0,
                          isActive: category.isActive ?? true,
                        });
                        setShowForm(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#0EA5B5] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this category?")) {
                          deleteCategory.mutate({ id: category.id });
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {editId ? "Edit" : "Add"} Category
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (EN) *
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
                <p className="text-xs text-gray-400 mt-1">
                  Slug is auto-generated from this name
                </p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (EN)
                </label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionEn: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                    placeholder="Paste URL or upload..."
                  />
                  <label className="h-10 px-3 border-2 border-dashed border-[#0EA5B5] text-[#0EA5B5] rounded-lg text-sm hover:bg-[#E6F7F8] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap">
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
                  <img src={form.image} alt="preview" className="mt-2 w-20 h-20 rounded-xl object-cover border border-gray-200" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order <span className="text-gray-400 font-normal">(0 = first)</span>
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    createCategory.isPending || updateCategory.isPending
                  }
                  className="flex-1 h-11 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50"
                >
                  {createCategory.isPending || updateCategory.isPending
                    ? "Saving..."
                    : editId
                      ? "Update"
                      : "Create"}
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
