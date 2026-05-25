import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  X,
  Truck,
  Save,
  Package,
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import trpc from "@/lib/trpc";

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Bejaia", "Biskra", "Bechar", "Blida", "Bouira",
  "Tamanrasset", "Tebessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Algiers", "Djelfa", "Jijel", "Setif", "Saida",
  "Skikda", "Sidi Bel Abbes", "Annaba", "Guelma", "Constantine", "Medea", "Mostaganem", "Msila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdes", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Ain Defla", "Naama", "Ain Temouchent", "Ghardaia", "Relizane", "Timimoun", "Bordj Badji Mokhtar",
  "Ouled Djellal", "Beni Abbes", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El Mghair", "El Meniaa"
];

interface PriceRow {
  destinationWilaya: string;
  homePrice: string;
  officePrice: string;
}

function makeEmptyPrices(): PriceRow[] {
  return WILAYAS.map((w) => ({
    destinationWilaya: w,
    homePrice: "",
    officePrice: "",
  }));
}

export default function AdminShipping() {
  const [showForm, setShowForm] = useState(false);
  const [editProfileId, setEditProfileId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("");
  const [originWilaya, setOriginWilaya] = useState("");
  const [companyId, setCompanyId] = useState(0);
  const [prices, setPrices] = useState<PriceRow[]>(makeEmptyPrices());
  const [fillHome, setFillHome] = useState("");
  const [fillOffice, setFillOffice] = useState("");
  const [priceSearch, setPriceSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: companies } = trpc.deliveryCompany.list.useQuery();
  const { data: profiles, isLoading } = trpc.shippingProfile.adminList.useQuery();

  // Get prices when editing
  const { data: editPrices } = trpc.shippingProfile.getPrices.useQuery(
    { profileId: editProfileId! },
    { enabled: editProfileId !== null }
  );

  const createProfile = trpc.shippingProfile.createWithPrices.useMutation({
    onSuccess: () => {
      utils.shippingProfile.adminList.invalidate();
      closeForm();
    },
  });

  const updateProfile = trpc.shippingProfile.updateWithPrices.useMutation({
    onSuccess: () => {
      utils.shippingProfile.adminList.invalidate();
      closeForm();
    },
  });

  const deleteProfile = trpc.shippingProfile.delete.useMutation({
    onSuccess: () => {
      utils.shippingProfile.adminList.invalidate();
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditProfileId(null);
    setProfileName("");
    setOriginWilaya("");
    setCompanyId(0);
    setPrices(makeEmptyPrices());
    setFillHome("");
    setFillOffice("");
    setPriceSearch("");
  };

  const startEdit = (profileId: number) => {
    const profile = profiles?.find((p) => p.id === profileId);
    if (!profile) return;

    setEditProfileId(profileId);
    setProfileName(profile.name);
    setOriginWilaya(profile.originWilaya);

    // Build price grid from existing prices
    const existingPricesMap = new Map<string, { home: string; office: string }>();
    editPrices?.forEach((p) => {
      existingPricesMap.set(p.destinationWilaya, {
        home: String(p.homePrice),
        office: String(p.officePrice),
      });
    });

    const newPrices = WILAYAS.map((w) => ({
      destinationWilaya: w,
      homePrice: existingPricesMap.get(w)?.home ?? "",
      officePrice: existingPricesMap.get(w)?.office ?? "",
    }));

    setPrices(newPrices);
    setShowForm(true);
  };

  // Auto-load prices when entering edit mode
  useState(() => {
    if (editProfileId && editPrices) {
      const existingPricesMap = new Map<string, { home: string; office: string }>();
      editPrices.forEach((p) => {
        existingPricesMap.set(p.destinationWilaya, {
          home: String(p.homePrice),
          office: String(p.officePrice),
        });
      });
      const newPrices = WILAYAS.map((w) => ({
        destinationWilaya: w,
        homePrice: existingPricesMap.get(w)?.home ?? "",
        officePrice: existingPricesMap.get(w)?.office ?? "",
      }));
      setPrices(newPrices);
    }
  });

  const handlePriceChange = (
    index: number,
    field: "homePrice" | "officePrice",
    value: string
  ) => {
    const newPrices = [...prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setPrices(newPrices);
  };

  const handleFillAll = () => {
    if (!fillHome && !fillOffice) return;
    const newPrices = prices.map((p) => ({
      ...p,
      homePrice: fillHome || p.homePrice,
      officePrice: fillOffice || p.officePrice,
    }));
    setPrices(newPrices);
  };

  const handleSubmit = () => {
    const filledPrices = prices.filter((p) => p.homePrice || p.officePrice);
    
    if (editProfileId) {
      updateProfile.mutate({
        id: editProfileId,
        name: profileName,
        originWilaya,
        companyId: 0,
        prices: filledPrices,
      });
    } else {
      createProfile.mutate({
        name: profileName,
        originWilaya,
        companyId: 0,
        prices: filledPrices,
      });
    }
  };

  const filteredPrices = useMemo(() => {
    if (!priceSearch) return prices;
    const q = priceSearch.toLowerCase();
    return prices.map((p, i) => ({ ...p, index: i })).filter((p) =>
      p.destinationWilaya.toLowerCase().includes(q)
    );
  }, [prices, priceSearch]);

  const filledCount = prices.filter((p) => p.homePrice || p.officePrice).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set shipping prices from origin wilaya to all destinations
          </p>
        </div>
        <button
          onClick={() => {
            closeForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Shipping Profile
        </button>
      </div>

      {/* Saved Profiles List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#0EA5B5]" />
          <h2 className="font-semibold">Saved Profiles</h2>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : profiles?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No shipping profiles. Add one to start.
            </p>
          ) : (
            <div className="space-y-2">
              {profiles?.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:border-[#0EA5B5]/30 hover:bg-[#E6F7F8]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E6F7F8] flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#0EA5B5]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {profile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        From: {profile.originWilaya}
                        {profile.companyName ? ` | ${profile.companyName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(profile.id)}
                      className="p-2 text-gray-400 hover:text-[#0EA5B5] transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this profile and all its prices?")) {
                          deleteProfile.mutate({ id: profile.id });
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Profile Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              {editProfileId ? "Edit" : "Add"} Shipping Profile
            </h2>
            <button onClick={closeForm}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Wilaya (Distribution) *
                </label>
                <select
                  value={originWilaya}
                  onChange={(e) => setOriginWilaya(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  required
                >
                  <option value="">Select wilaya...</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Company Name *
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., Yalidine, Zaki, Ecotrack..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                  required
                />
              </div>
            </div>

            {/* Price Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Delivery Prices (Manual Entry)
                </p>
                <input
                  type="text"
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  placeholder="Search wilaya..."
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#0EA5B5] outline-none w-48"
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-0 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <div className="px-4 py-3 border-b border-r border-gray-200">
                    Destination Wilaya
                  </div>
                  <div className="px-4 py-3 border-b border-r border-gray-200 text-center">
                    Home Delivery (DZD)
                  </div>
                  <div className="px-4 py-3 border-b border-gray-200 text-center">
                    Office Delivery (DZD)
                  </div>
                </div>

                {/* Table Body */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredPrices.map((row, idx) => {
                    const originalIndex =
                      "index" in row ? (row as any).index : prices.indexOf(row);
                    const hasValue = row.homePrice || row.officePrice;
                    return (
                      <div
                        key={row.destinationWilaya}
                        className={`grid grid-cols-3 gap-0 ${
                          hasValue ? "bg-amber-50/30" : ""
                        } hover:bg-gray-50/50 transition-colors`}
                      >
                        <div className="px-4 py-2.5 border-b border-r border-gray-100 text-sm font-medium text-gray-700 flex items-center">
                          {row.destinationWilaya}
                          {hasValue && (
                            <span className="ml-2 w-2 h-2 bg-green-400 rounded-full" />
                          )}
                        </div>
                        <div className="px-4 py-2 border-b border-r border-gray-100">
                          <input
                            type="text"
                            value={row.homePrice}
                            onChange={(e) =>
                              handlePriceChange(
                                originalIndex,
                                "homePrice",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="w-full h-8 px-2 rounded border border-gray-200 text-sm text-center focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                          />
                        </div>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={row.officePrice}
                            onChange={(e) =>
                              handlePriceChange(
                                originalIndex,
                                "officePrice",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="w-full h-8 px-2 rounded border border-gray-200 text-sm text-center focus:ring-2 focus:ring-[#0EA5B5] outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={
                  !profileName ||
                  !originWilaya ||
                  createProfile.isPending ||
                  updateProfile.isPending
                }
                className="inline-flex items-center gap-2 h-11 px-6 bg-[#0EA5B5] text-white font-medium rounded-xl hover:bg-[#0A7A86] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {createProfile.isPending || updateProfile.isPending
                  ? "Saving..."
                  : editProfileId
                    ? "Update Profile"
                    : "Save Profile"}
              </button>
              <button
                onClick={closeForm}
                className="h-11 px-6 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <span className="text-sm text-gray-500 ml-auto">
                {filledCount} wilayas have prices set
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
