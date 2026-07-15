import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, Trash2, Sliders, Palette, Maximize2, Tag, Bookmark, Layers } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Masters() {
  const [activeTab, setActiveTab] = useState("category"); // category, subcategory, brand, color, size, collection
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parent Categories for subcategory creation
  const [categoriesList, setCategoriesList] = useState([]);

  // Forms state
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", slug: "", description: "", parentCategory: "" });
  const [brandForm, setBrandForm] = useState({ name: "", slug: "", description: "" });
  const [colorForm, setColorForm] = useState({ name: "", hex: "#000000", colorFamily: "" });
  const [colorFamilyForm, setColorFamilyForm] = useState({ name: "", slug: "", description: "" });
  const [sizeForm, setSizeForm] = useState({ name: "", description: "" });
  const [collectionForm, setCollectionForm] = useState({ name: "", slug: "", description: "" });
  const [taxForm, setTaxForm] = useState({ name: "", rate: 0 });

  const [submitting, setSubmitting] = useState(false);

  // Parent Categories for subcategory creation
  const [colorFamiliesList, setColorFamiliesList] = useState([]);

  useEffect(() => {
    loadTabItems();
    if (activeTab === "subcategory") {
      loadCategoriesList();
    } else if (activeTab === "color") {
      loadColorFamiliesList();
    }
  }, [activeTab]);

  async function loadTabItems() {
    try {
      setLoading(true);
      const res = await api.masters.list(activeTab);
      setItems(res.data || []);
    } catch (err) {
      console.error(`Failed to load ${activeTab} items:`, err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategoriesList() {
    try {
      const res = await api.masters.list("category");
      const cats = res.data || [];
      setCategoriesList(cats);
      if (cats.length > 0) {
        setSubcategoryForm(f => ({ ...f, parentCategory: cats[0]._id }));
      }
    } catch (err) {
      console.error("Failed to load categories for select:", err);
    }
  }

  async function loadColorFamiliesList() {
    try {
      const res = await api.masters.list("color_family");
      const families = res.data || [];
      setColorFamiliesList(families);
      if (families.length > 0) {
        setColorForm(f => ({ ...f, colorFamily: families[0]._id }));
      }
    } catch (err) {
      console.error("Failed to load color families for select:", err);
    }
  }

  const handleCreateMaster = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let payload = {};

    switch (activeTab) {
      case "category": payload = categoryForm; break;
      case "subcategory": payload = { ...subcategoryForm, category: subcategoryForm.parentCategory }; break;
      case "brand": payload = brandForm; break;
      case "color_family": payload = colorFamilyForm; break;
      case "color": payload = colorForm; break;
      case "size": payload = sizeForm; break;
      case "collection": payload = collectionForm; break;
      case "taxes": payload = { ...taxForm, rate: parseFloat(taxForm.rate) }; break;
      default: return;
    }

    try {
      await api.masters.create(activeTab, payload);
      alert(`${activeTab.toUpperCase()} master record created!`);
      // Reset forms
      setCategoryForm({ name: "", slug: "", description: "" });
      setSubcategoryForm(f => ({ name: "", slug: "", description: "", parentCategory: categoriesList[0]?._id || "" }));
      setBrandForm({ name: "", slug: "", description: "" });
      setColorFamilyForm({ name: "", slug: "", description: "" });
      setColorForm(f => ({ name: "", hex: "#000000", colorFamily: colorFamiliesList[0]?._id || "" }));
      setSizeForm({ name: "", description: "" });
      setCollectionForm({ name: "", slug: "", description: "" });
      setTaxForm({ name: "", rate: 0 });
      loadTabItems();
    } catch (err) {
      alert(err.message || "Failed to create master entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaster = async (id) => {
    if (!window.confirm("Archive this entry? If attached to products, this might break listings.")) return;
    try {
      await api.masters.delete(activeTab, id);
      loadTabItems();
    } catch (err) {
      alert(err.message || "Failed to delete master entry.");
    }
  };

  const tabs = [
    { id: "category", label: "Categories", icon: Tag },
    { id: "subcategory", label: "Subcategories", icon: Bookmark },
    { id: "brand", label: "Brands", icon: Sliders },
    { id: "color_family", label: "Color Families", icon: Layers },
    { id: "color", label: "Colors", icon: Palette },
    { id: "size", label: "Sizes", icon: Maximize2 },
    { id: "collection", label: "Collections", icon: Layers },
    { id: "taxes", label: "Taxes", icon: Tag }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <PageHeader
        title="Master Data Lookups"
        subtitle="Platform Parameters Config"
      />

      {/* Tabs Menu */}
      <div className="flex border-b border-border-custom gap-6 select-none overflow-x-auto pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-xs uppercase tracking-widest font-semibold flex items-center gap-2 border-b-2 transition-all duration-300 focus:outline-none ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creation Form (Left, 5 cols) */}
        <div className="lg:col-span-5">
          <Card>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary mb-6 pb-2 border-b border-border-custom">
              Define New {activeTab}
            </h3>

            <form onSubmit={handleCreateMaster} className="space-y-4">
              {/* Category Form Fields */}
              {activeTab === "category" && (
                <>
                  <Input
                    label="Category Name"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="E.g., Knitwear"
                  />
                  <Input
                    label="URL Slug"
                    required
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  />
                  <Input
                    label="Description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Brief description..."
                    multiline
                    rows={3}
                  />
                </>
              )}

              {/* Subcategory Form Fields */}
              {activeTab === "subcategory" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Parent Category</label>
                    <select
                      required
                      value={subcategoryForm.parentCategory}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, parentCategory: e.target.value })}
                      className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    >
                      <option value="">Select Parent</option>
                      {categoriesList.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Subcategory Name"
                    required
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="E.g., Crewnecks"
                  />
                  <Input
                    label="URL Slug"
                    required
                    value={subcategoryForm.slug}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                  />
                  <Input
                    label="Description"
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                    placeholder="Brief description..."
                    multiline
                    rows={3}
                  />
                </>
              )}

              {/* Brand Form Fields */}
              {activeTab === "brand" && (
                <>
                  <Input
                    label="Brand Name"
                    required
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="E.g., Maison Aura"
                  />
                  <Input
                    label="URL Slug"
                    required
                    value={brandForm.slug}
                    onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                  />
                  <Input
                    label="Description"
                    value={brandForm.description}
                    onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                    placeholder="Brief description..."
                    multiline
                    rows={3}
                  />
                </>
              )}

              {/* Color Family Form Fields */}
              {activeTab === "color_family" && (
                <>
                  <Input
                    label="Color Family Name"
                    required
                    value={colorFamilyForm.name}
                    onChange={(e) => setColorFamilyForm({ ...colorFamilyForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="E.g., Reds"
                  />
                  <Input
                    label="URL Slug"
                    required
                    value={colorFamilyForm.slug}
                    onChange={(e) => setColorFamilyForm({ ...colorFamilyForm, slug: e.target.value })}
                  />
                  <Input
                    label="Description"
                    value={colorFamilyForm.description}
                    onChange={(e) => setColorFamilyForm({ ...colorFamilyForm, description: e.target.value })}
                    placeholder="Brief description..."
                    multiline
                    rows={3}
                  />
                </>
              )}

              {/* Color Form Fields */}
              {activeTab === "color" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Color Family</label>
                    <select
                      required
                      value={colorForm.colorFamily}
                      onChange={(e) => setColorForm({ ...colorForm, colorFamily: e.target.value })}
                      className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    >
                      <option value="">Select Family</option>
                      {colorFamiliesList.map((cf) => (
                        <option key={cf._id} value={cf._id}>{cf.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Color Name"
                    required
                    value={colorForm.name}
                    onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                    placeholder="E.g., Midnight Silk Black"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Hex CSS Color Code</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        required
                        value={colorForm.hex}
                        onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                        className="w-16 h-[38px] p-0 cursor-pointer border-none bg-transparent rounded"
                      />
                      <div className="flex-1">
                        <Input
                          required
                          value={colorForm.hex}
                          onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Size Form Fields */}
              {activeTab === "size" && (
                <>
                  <Input
                    label="Size Symbol"
                    required
                    value={sizeForm.name}
                    onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                    placeholder="E.g., M or 38"
                  />
                  <Input
                    label="Description (Measurements/Context)"
                    value={sizeForm.description}
                    onChange={(e) => setSizeForm({ ...sizeForm, description: e.target.value })}
                    placeholder="E.g., Medium Fit (38-40 Chest)"
                  />
                </>
              )}

              {/* Collection Form Fields */}
              {activeTab === "collection" && (
                <>
                  <Input
                    label="Collection Name"
                    required
                    value={collectionForm.name}
                    onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="E.g., Autumn / Winter 26"
                  />
                  <Input
                    label="URL Slug"
                    required
                    value={collectionForm.slug}
                    onChange={(e) => setCollectionForm({ ...collectionForm, slug: e.target.value })}
                  />
                  <Input
                    label="Description"
                    value={collectionForm.description}
                    onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                    placeholder="Brief description..."
                    multiline
                    rows={3}
                  />
                </>
              )}

              {/* Tax Form Fields */}
              {activeTab === "taxes" && (
                <>
                  <Input
                    label="Tax Rule Name"
                    required
                    value={taxForm.name}
                    onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                    placeholder="E.g., Standard GST 12%"
                  />
                  <Input
                    label="Tax Rate (%)"
                    type="number"
                    step="0.01"
                    required
                    value={taxForm.rate}
                    onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
                    placeholder="12.0"
                  />
                </>
              )}

              <Button type="submit" disabled={submitting} className="w-full mt-4" size="lg">
                {submitting ? "Saving..." : `Create ${activeTab.toUpperCase()} Master Record`}
              </Button>
            </form>
          </Card>
        </div>

        {/* Existing Items List (Right, 7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 pb-2 border-b border-border-custom">
              <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary">
                Configured {activeTab} Records ({items.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center text-xs uppercase tracking-widest text-text-secondary py-16 select-none">
                Retrieving lookup values...
              </div>
            ) : items.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto">
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Identifier / Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <span className="font-semibold text-text-primary uppercase text-[13px]">
                            {item.name}
                          </span>
                          {item.hex && (
                            <div className="flex items-center gap-2 mt-1 select-none">
                              <div
                                className="w-4 h-4 rounded-full border border-border-custom"
                                style={{ backgroundColor: item.hex }}
                              />
                              <span className="font-mono text-[10px] uppercase text-text-secondary tracking-wider">{item.hex}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-text-secondary tracking-wider">
                          {item.rate !== undefined ? `${item.rate}%` : (item.slug || item.description || item.parentCategory?.name || "N/A")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMaster(item._id)}
                              title="Remove Master lookup"
                              className="text-danger border-danger-light hover:bg-danger hover:text-white px-2"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-20 text-xs uppercase tracking-widest text-text-muted border-t border-dashed border-border-custom m-6 mt-0">
                No entries found.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
