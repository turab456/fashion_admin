import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, Edit2, Trash2, Layers, X, Image as ImageIcon } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";

const resolveImage = (url) => {
  if (!url) return "/images/products/placeholder.jpg";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/assets/")) {
    return `http://localhost:3000${url}`;
  }
  if (url.startsWith("/uploads/")) {
    return `http://localhost:5000${url}`;
  }
  return url;
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [collections, setCollections] = useState([]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "", slug: "", sku: "", brand: "", category: "", subcategory: "",
    description: "", materials: "", careInstructions: "", images: "",
    price: 350, availability: true, collectionRef: ""
  });

  const [variantForm, setVariantForm] = useState({
    color: "", size: "", price: 350, stock: 5, sku: ""
  });

  const [loadingForm, setLoadingForm] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    const newUrls = [];
    try {
      for (const file of files) {
        const base64 = await toBase64(file);
        const res = await api.products.upload(base64);
        if (res.data?.url) {
          newUrls.push(res.data.url);
        }
      }
      setProductForm(prev => {
        const currentImgs = prev.images
          ? prev.images.split(",").map(i => i.trim()).filter(Boolean)
          : [];
        return {
          ...prev,
          images: [...currentImgs, ...newUrls].join(", ")
        };
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to upload one or more images.");
    } finally {
      setUploadingImages(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadLookups();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await api.products.list({ limit: 100 });
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const [catRes, subRes, brandRes, colorRes, sizeRes, colRes] = await Promise.all([
        api.masters.list("category"),
        api.masters.list("subcategory"),
        api.masters.list("brand"),
        api.masters.list("color"),
        api.masters.list("size"),
        api.masters.list("collection")
      ]);
      setCategories(catRes.data || []);
      setSubcategories(subRes.data || []);
      setBrands(brandRes.data || []);
      setColors(colorRes.data || []);
      setSizes(sizeRes.data || []);
      setCollections(colRes.data || []);
    } catch (err) {
      console.error("Failed to load lookups:", err);
    }
  }

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: "", slug: "", sku: "", brand: "", category: "", subcategory: "", description: "", materials: "", careInstructions: "", images: "", price: 350, availability: true, collectionRef: "" });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || "", slug: p.slug || "", sku: p.sku || "",
      brand: p.brand?._id || p.brand || "",
      category: p.category?._id || p.category || "",
      subcategory: p.subcategory?._id || p.subcategory || "",
      description: p.description || "", materials: p.materials || "",
      careInstructions: p.careInstructions || "",
      images: p.images ? p.images.join(", ") : "",
      price: p.variants?.[0]?.prices?.mrp || 350,
      availability: p.availability ?? true,
      collectionRef: p.collectionRef?._id || p.collectionRef || ""
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    const parsedImages = productForm.images
      ? productForm.images.split(",").map(img => img.trim()).filter(Boolean)
      : [];
    const payload = {
      ...productForm, images: parsedImages, price: Number(productForm.price),
      brand: productForm.brand || undefined,
      category: productForm.category || undefined,
      subcategory: productForm.subcategory || undefined,
      collectionRef: productForm.collectionRef || null
    };
    try {
      if (editingProduct) {
        await api.products.update(editingProduct._id, payload);
      } else {
        await api.products.create(payload);
      }
      setIsProductModalOpen(false);
      loadProducts();
    } catch (err) {
      alert(err.message || "Failed to save product.");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product? All variants will be removed.")) return;
    try {
      await api.products.delete(id);
      loadProducts();
    } catch (err) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const openVariantsModal = (p) => {
    setSelectedProductForVariants(p);
    setVariantForm({ color: colors[0]?._id || "", size: sizes[0]?._id || "", price: p.price || 350, stock: 10, sku: `${p.sku}-VAR` });
    setIsVariantModalOpen(true);
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProductForVariants) return;
    setLoadingForm(true);
    try {
      await api.products.createVariant(selectedProductForVariants._id, {
        ...variantForm, price: Number(variantForm.price), stock: Number(variantForm.stock)
      });
      const res = await api.products.getById(selectedProductForVariants._id);
      setSelectedProductForVariants(res.data);
      loadProducts();
    } catch (err) {
      alert(err.message || "Failed to create variant.");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;
    try {
      await api.products.deleteVariant(variantId);
      const res = await api.products.getById(selectedProductForVariants._id);
      setSelectedProductForVariants(res.data);
      loadProducts();
    } catch (err) {
      alert(err.message || "Failed to delete variant.");
    }
  };

  const getStockStatus = (p) => {
    const total = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
    if (total === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (total < 10) return <Badge variant="warning">Low ({total})</Badge>;
    return <Badge variant="success">In Stock ({total})</Badge>;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog"
        action={
          <Button onClick={openAddProduct} icon={Plus}>
            Add Product
          </Button>
        }
      />

      {/* Products Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="text-center p-14 text-text-muted text-sm">Loading products...</div>
        ) : products.length > 0 ? (
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveImage(p.images?.[0])}
                        alt={p.name}
                        className="w-11 h-[52px] object-cover rounded border border-border-custom shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{p.name}</p>
                        <p className="text-xs text-text-muted mt-0.5 font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-text-secondary text-[13px]">{p.sku}</TableCell>
                  <TableCell className="text-[13px]">{p.category?.name || "Uncategorized"}</TableCell>
                  <TableCell className="font-semibold text-[13px]">₹{p.price}</TableCell>
                  <TableCell>{getStockStatus(p)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openVariantsModal(p)} title="Manage Variants">
                        <Layers size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditProduct(p)} title="Edit">
                        <Edit2 size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(p._id)} title="Delete" className="text-danger hover:text-red-700">
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-14 text-center text-text-muted text-sm">
            No products found. Click "Add Product" to get started.
          </div>
        )}
      </Card>

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            <Button onClick={handleProductSubmit} loading={loadingForm}>
              {loadingForm ? "Saving..." : "Save Product"}
            </Button>
          </>
        }
      >
        <form id="productForm" onSubmit={handleProductSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name *" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Cashmere Trench Coat" />
            <Input label="URL Slug *" required value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} placeholder="e.g. cashmere-trench-coat" />
            <Input label="SKU *" required value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} placeholder="e.g. AUR-TR-CASH" />
            <Input label="Base Price (₹) *" type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
            
            <div className="flex flex-col">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">Brand</label>
              <select className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })}>
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">Category</label>
              <select className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">Subcategory</label>
              <select className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={productForm.subcategory} onChange={e => setProductForm({ ...productForm, subcategory: e.target.value })}>
                <option value="">Select Subcategory</option>
                {subcategories.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">Collection</label>
              <select className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={productForm.collectionRef} onChange={e => setProductForm({ ...productForm, collectionRef: e.target.value })}>
                <option value="">No Collection</option>
                {collections.map(col => <option key={col._id} value={col._id}>{col.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">Availability</label>
              <select className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={productForm.availability ? "true" : "false"} onChange={e => setProductForm({ ...productForm, availability: e.target.value === "true" })}>
                <option value="true">Active & Visible</option>
                <option value="false">Hidden / Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">Product Images</label>
            <div className="flex gap-2.5 flex-wrap mb-2.5 items-center">
              {(productForm.images ? productForm.images.split(",").map(i => i.trim()).filter(Boolean) : []).map((img, idx) => (
                <div key={idx} className="relative w-[70px] h-[80px] border border-border-custom rounded-md overflow-hidden bg-gray-50">
                  <img src={resolveImage(img)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const imgs = productForm.images.split(",").map(i => i.trim()).filter(Boolean);
                      imgs.splice(idx, 1);
                      setProductForm({ ...productForm, images: imgs.join(", ") });
                    }}
                    className="absolute top-1 right-1 bg-red-500/90 text-white border-none rounded-full w-4 h-4 flex items-center justify-center cursor-pointer text-[10px] leading-none hover:bg-red-600 transition-colors focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-[70px] h-[80px] border border-dashed border-gray-300 hover:border-accent rounded-md flex flex-col items-center justify-center cursor-pointer text-text-secondary bg-gray-50 text-[11px] gap-1 transition-colors">
                <ImageIcon size={16} />
                <span>Upload</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            {uploadingImages && <p className="text-xs text-accent mb-2">Uploading images...</p>}
            <Input
              value={productForm.images}
              onChange={e => setProductForm({ ...productForm, images: e.target.value })}
              placeholder="Or paste image URLs separated by commas..."
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">Description *</label>
            <textarea 
              required 
              rows={3} 
              value={productForm.description} 
              onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
              placeholder="Product description..."
              className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Materials" value={productForm.materials} onChange={e => setProductForm({ ...productForm, materials: e.target.value })} placeholder="e.g. 90% Wool, 10% Cashmere" />
            <Input label="Care Instructions" value={productForm.careInstructions} onChange={e => setProductForm({ ...productForm, careInstructions: e.target.value })} placeholder="e.g. Dry clean only" />
          </div>

          {/* Hidden submit button to trigger form submission via footer button */}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      {/* VARIANTS MODAL */}
      <Modal
        isOpen={isVariantModalOpen && !!selectedProductForVariants}
        onClose={() => setIsVariantModalOpen(false)}
        title={selectedProductForVariants ? `Manage Variants — ${selectedProductForVariants.name}` : "Manage Variants"}
        maxWidth="max-w-3xl"
      >
        {selectedProductForVariants && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Add Form */}
            <div className="md:col-span-2 md:border-r border-border-custom md:pr-6">
              <h4 className="text-[13px] font-semibold mb-3.5">Add Variant</h4>
              <form onSubmit={handleAddVariant} className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Color</label>
                  <select required className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })}>
                    <option value="">Select Color</option>
                    {colors.map(c => <option key={c._id} value={c._id}>{c.name} ({c.hex})</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Size</label>
                  <select required className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={variantForm.size} onChange={e => setVariantForm({ ...variantForm, size: e.target.value })}>
                    <option value="">Select Size</option>
                    {sizes.map(s => <option key={s._id} value={s._id}>{s.name} ({s.description || "N/A"})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Price (₹)" type="number" required value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: e.target.value })} />
                  <Input label="Stock Qty" type="number" required value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: e.target.value })} />
                </div>
                <Input label="Variant SKU" value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} placeholder="e.g. AUR-TR-XS-BLK" />
                
                <Button type="submit" disabled={loadingForm} loading={loadingForm} className="w-full mt-2">
                  Add Variant
                </Button>
              </form>
            </div>
            
            {/* Existing Variants */}
            <div className="md:col-span-3">
              <h4 className="text-[13px] font-semibold mb-3.5">
                Existing Variants ({selectedProductForVariants.variants?.length || 0})
              </h4>
              {selectedProductForVariants.variants?.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto border border-border-custom rounded-lg bg-white">
                  <Table className="border-0 rounded-none">
                    <TableHeader>
                      <TableHead>Color / Size</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead></TableHead>
                    </TableHeader>
                    <TableBody>
                      {selectedProductForVariants.variants.map((v) => (
                        <TableRow key={v._id}>
                          <TableCell>
                            <p className="text-[13px] font-medium text-text-primary">{v.size?.name || "—"}</p>
                            <p className="text-xs text-text-secondary">{v.color?.name || "—"}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-text-secondary">{v.sku}</TableCell>
                          <TableCell className="text-[13px]">₹{v.price}</TableCell>
                          <TableCell className="text-[13px]">{v.stock}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteVariant(v._id)} title="Remove" className="text-danger hover:text-red-700">
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-text-muted text-[13px] bg-gray-50">
                  No variants yet. Add one using the form.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
