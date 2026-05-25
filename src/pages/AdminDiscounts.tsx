import { useState } from "react";
import { Plus, Trash2, X, Tag, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import trpc from "@/lib/trpc";

const TYPE_LABELS: Record<string, string> = {
  percentage: "نسبة مئوية %",
  fixed_amount: "مبلغ ثابت DZD",
  free_shipping: "شحن مجاني",
  bundle: "حزمة",
};

interface DiscountForm {
  id?: number;
  name: string;
  type: "percentage" | "fixed_amount" | "free_shipping" | "bundle";
  value: string;
  minOrderValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyForm: DiscountForm = {
  name: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function AdminDiscounts() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DiscountForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.discount.adminList.useQuery();

  const createRule = trpc.discount.create.useMutation({
    onSuccess: () => { utils.discount.adminList.invalidate(); setShowForm(false); setForm(emptyForm); },
  });
  const updateRule = trpc.discount.update.useMutation({
    onSuccess: () => { utils.discount.adminList.invalidate(); setShowForm(false); setForm(emptyForm); },
  });
  const deleteRule = trpc.discount.delete.useMutation({
    onSuccess: () => { utils.discount.adminList.invalidate(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      value: form.value || undefined,
      minOrderValue: form.minOrderValue || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
    };
    if (form.id) {
      updateRule.mutate({ id: form.id, ...payload });
    } else {
      createRule.mutate(payload);
    }
  };

  const toggleActive = (id: number, current: boolean) => {
    updateRule.mutate({ id, isActive: !current });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts / قواعد الخصم</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount rules and promotions</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="inline-flex items-center gap-2 h-10 px-4 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add Discount Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : rules?.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No discount rules yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first discount rule to start saving customers money</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rules?.map((rule) => (
              <div key={rule.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                    <Tag className={`w-5 h-5 ${rule.isActive ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{rule.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">{TYPE_LABELS[rule.type]}</span>
                      {rule.value && (
                        <span className="font-medium text-[#0EA5B5]">
                          {rule.type === "percentage" ? `${rule.value}%` : `${Number(rule.value).toLocaleString()} DZD`}
                        </span>
                      )}
                      {rule.minOrderValue && (
                        <span>Min: {Number(rule.minOrderValue).toLocaleString()} DZD</span>
                      )}
                      {rule.startDate && <span>From: {new Date(rule.startDate).toLocaleDateString()}</span>}
                      {rule.endDate && <span>Until: {new Date(rule.endDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleActive(rule.id, rule.isActive ?? true)}
                    className="p-1.5 text-gray-400 hover:text-[#0EA5B5] transition-colors"
                    title="Toggle Active"
                  >
                    {rule.isActive ? <ToggleRight className="w-5 h-5 text-[#0EA5B5]" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setForm({
                        id: rule.id,
                        name: rule.name,
                        type: rule.type as DiscountForm["type"],
                        value: rule.value ? String(rule.value) : "",
                        minOrderValue: rule.minOrderValue ? String(rule.minOrderValue) : "",
                        startDate: rule.startDate ? new Date(rule.startDate).toISOString().slice(0, 10) : "",
                        endDate: rule.endDate ? new Date(rule.endDate).toISOString().slice(0, 10) : "",
                        isActive: rule.isActive ?? true,
                      });
                      setShowForm(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#0EA5B5] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this discount rule?")) deleteRule.mutate({ id: rule.id }); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">{form.id ? "Edit Discount Rule" : "New Discount Rule"}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Summer Sale 20%, Free shipping over 5000 DZD"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as DiscountForm["type"] })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed_amount">مبلغ ثابت DZD</option>
                    <option value="free_shipping">شحن مجاني</option>
                    <option value="bundle">حزمة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === "percentage" ? "Value (%)" : form.type === "fixed_amount" ? "Value (DZD)" : "Value"}
                  </label>
                  <input
                    type="text"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === "percentage" ? "20" : "500"}
                    disabled={form.type === "free_shipping"}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Value (DZD)</label>
                <input
                  type="text"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="0 = no minimum"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#0EA5B5] focus:ring-[#0EA5B5]" />
                Active (visible to customers)
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createRule.isPending || updateRule.isPending}
                  className="flex-1 h-11 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50"
                >
                  {createRule.isPending || updateRule.isPending ? "Saving..." : form.id ? "Update" : "Create"}
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
