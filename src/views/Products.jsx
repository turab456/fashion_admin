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
  if (!url || url === "/images/products/placeholder.jpg") return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/assets/")) {
    return `http://localhost:3000${url}`;
  }
  if (url.startsWith("/uploads/")) {
    return `https://fashion-be-nfrg.onrender.com${url}`;
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalVariants, setModalVariants] = useState([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "", slug: "", sku: "", brand: "", category: "", subcategory: "",
    description: "", materials: "", careInstructions: "", images: "",
    price: 350, salePrice: "", availability: true, collectionRef: ""
  });

  const [variantForm, setVariantForm] = useState({
    color: "",
    size: "",
    mrp: 350,
    sellingPrice: 350,
    costPrice: 150,
    weight: 300,
    stock: 10,
    sku: "",
    images: "",
    showcase: false
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
      setVariantForm(prev => {
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

  useEffect(() => {
    if (colors.length > 0 && !variantForm.color) {
      setVariantForm(prev => ({ ...prev, color: colors[0]._id }));
    }
  }, [colors]);

  useEffect(() => {
    if (sizes.length > 0 && !variantForm.size) {
      setVariantForm(prev => ({ ...prev, size: sizes[0]._id }));
    }
  }, [sizes]);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await api.products.list({ limit: 100, status: "all" });
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
    setProductForm({ name: "", slug: "", sku: "", brand: "", category: "", subcategory: "", description: "", materials: "", careInstructions: "", images: "", price: 350, salePrice: "", availability: true, collectionRef: "" });
    setModalVariants([]);
    setVariantForm({
      color: colors[0]?._id || "",
      size: sizes[0]?._id || "",
      mrp: 350,
      sellingPrice: 350,
      costPrice: 150,
      weight: 300,
      stock: 10,
      sku: ""
    });
    setEditingVariantIndex(null);
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
      price: p.price || 350,
      salePrice: p.salePrice || "",
      availability: p.status === "Active",
      collectionRef: p.collectionRef?._id || p.collectionRef || ""
    });
    setModalVariants(p.variants || []);
    setVariantForm({
      color: colors[0]?._id || "",
      size: sizes[0]?._id || "",
      mrp: p.price || 350,
      sellingPrice: p.price || 350,
      costPrice: Math.round((p.price || 350) * 0.4),
      weight: 300,
      stock: 10,
      sku: `${p.sku}-VAR`
    });
    setEditingVariantIndex(null);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    const parsedImages = productForm.images
      ? productForm.images.split(",").map(img => img.trim()).filter(Boolean)
      : [];
    const isNew = !editingProduct;
    const payload = {
      ...productForm,
      images: parsedImages,
      price: Number(productForm.price),
      salePrice: productForm.salePrice ? Number(productForm.salePrice) : null,
      status: isNew ? "Draft" : (productForm.availability ? "Active" : "Draft"),
      brand: productForm.brand || undefined,
      category: productForm.category || undefined,
      subcategory: productForm.subcategory || undefined,
      collectionRef: productForm.collectionRef || null
    };

    try {
      if (editingProduct) {
        await api.products.update(editingProduct._id, payload);
      } else {
        const res = await api.products.create(payload);
        const newProductId = res.data?._id;

        if (newProductId && modalVariants.length > 0) {
          for (const variant of modalVariants) {
            const varPayload = {
              color: variant.color,
              size: variant.size,
              sku: variant.sku,
              stock: variant.stock,
              weight: variant.weight,
              prices: variant.prices,
              images: parsedImages.length > 0 ? parsedImages : ["/images/products/placeholder.jpg"]
            };
            try {
              await api.products.createVariant(newProductId, varPayload);
            } catch (err) {
              console.error("Failed to create variant:", variant.sku, err);
            }
          }
        }
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

  const handleModalAddVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.color || !variantForm.size) {
      alert("Please select both Color and Size.");
      return;
    }

    const colorObj = colors.find(c => c._id === variantForm.color);
    const sizeObj = sizes.find(s => s._id === variantForm.size);

    const baseM = Number(productForm.price) || 350;
    const parsedImages = variantForm.images
      ? variantForm.images.split(",").map(i => i.trim()).filter(Boolean)
      : [];

    const newVar = {
      color: variantForm.color,
      size: variantForm.size,
      sku: variantForm.sku.trim() || `${productForm.sku}-${colorObj?.hex.replace("#", "") || "COL"}-${sizeObj?.name || "SZ"}`.toUpperCase(),
      stock: Number(variantForm.stock),
      weight: Number(variantForm.weight),
      prices: {
        mrp: baseM,
        sellingPrice: baseM,
        costPrice: Math.round(baseM * 0.45),
      },
      images: parsedImages,
      showcase: variantForm.showcase || false,
      colorDetails: colorObj,
      sizeDetails: sizeObj,
    };

    if (editingProduct && editingVariantIndex !== null && modalVariants[editingVariantIndex]._id) {
      setLoadingForm(true);
      try {
        const payload = {
          color: newVar.color,
          size: newVar.size,
          sku: newVar.sku,
          stock: newVar.stock,
          weight: newVar.weight,
          prices: newVar.prices,
          images: newVar.images,
          showcase: newVar.showcase
        };
        await api.products.updateVariant(modalVariants[editingVariantIndex]._id, payload);
        const res = await api.products.getById(editingProduct._id);
        setModalVariants(res.data.variants || []);
        setVariantForm(prev => ({
          ...prev,
          sku: `${editingProduct.sku}-VAR-${Date.now().toString().slice(-4)}`,
          images: "",
          showcase: false
        }));
        setEditingVariantIndex(null);
        loadProducts();
      } catch (err) {
        alert(err.message || "Failed to update variant.");
      } finally {
        setLoadingForm(false);
      }
    } else if (editingProduct && editingVariantIndex === null) {
      setLoadingForm(true);
      try {
        const payload = {
          color: newVar.color,
          size: newVar.size,
          sku: newVar.sku,
          stock: newVar.stock,
          weight: newVar.weight,
          prices: newVar.prices,
          images: newVar.images,
          showcase: newVar.showcase
        };
        await api.products.createVariant(editingProduct._id, payload);
        const res = await api.products.getById(editingProduct._id);
        setModalVariants(res.data.variants || []);
        setVariantForm(prev => ({
          ...prev,
          sku: `${editingProduct.sku}-VAR-${Date.now().toString().slice(-4)}`,
          images: "",
          showcase: false
        }));
        loadProducts();
      } catch (err) {
        alert(err.message || "Failed to add variant.");
      } finally {
        setLoadingForm(false);
      }
    } else {
      const duplicate = modalVariants.some((v, idx) => idx !== editingVariantIndex && v.color === newVar.color && v.size === newVar.size);
      if (duplicate) {
        alert("A variant with this Color and Size already exists in list.");
        return;
      }
      
      if (editingVariantIndex !== null) {
        setModalVariants(prev => {
          const newVariants = [...prev];
          newVariants[editingVariantIndex] = newVar;
          return newVariants;
        });
        setEditingVariantIndex(null);
      } else {
        setModalVariants(prev => [...prev, newVar]);
      }
      
      setVariantForm(prev => ({
        ...prev,
        sku: `${productForm.sku}-VAR-${Date.now().toString().slice(-4)}`,
        images: "",
        showcase: false
      }));
    }
  };

  const handleModalRemoveVariant = async (indexOrId, isDbId = false) => {
    if (!window.confirm("Remove this variant?")) return;

    if (isDbId) {
      setLoadingForm(true);
      try {
        await api.products.deleteVariant(indexOrId);
        const res = await api.products.getById(editingProduct._id);
        setModalVariants(res.data.variants || []);
        loadProducts();
      } catch (err) {
        alert(err.message || "Failed to remove variant.");
      } finally {
        setLoadingForm(false);
      }
    } else {
      setModalVariants(prev => prev.filter((_, idx) => idx !== indexOrId));
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
              <TableHead>MRP</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-[52px] rounded overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-border-custom">
                        {p.images && p.images[0] && resolveImage(p.images[0]) ? (
                          <img
                            src={resolveImage(p.images[0])}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="text-gray-400" size={16} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text-primary text-sm">{p.name}</p>
                          {p.status === "Draft" ? (
                            <Badge variant="warning">Draft</Badge>
                          ) : p.status === "Inactive" ? (
                            <Badge variant="danger">Inactive</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-text-secondary text-[13px]">{p.sku}</TableCell>
                  <TableCell className="text-[13px]">{p.category?.name || "Uncategorized"}</TableCell>
                  <TableCell className="font-semibold text-[13px]">₹{p.price}</TableCell>
                  <TableCell className="font-semibold text-text-primary text-[13px]">
                    {p.salePrice !== undefined && p.salePrice !== null ? `₹${p.salePrice}` : "-"}
                  </TableCell>
                  <TableCell>{getStockStatus(p)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
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
        maxWidth="max-w-4xl"
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
            <Input label="Base Price (MRP) (₹) *" type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
            <Input label="Discounted Price (Selling Price) (₹)" type="number" value={productForm.salePrice} onChange={e => setProductForm({ ...productForm, salePrice: e.target.value })} placeholder="Leave blank if no discount" />
            
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

            <div className="flex flex-col col-span-2">
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">Availability (Will be Draft for new products)</label>
              <select className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" value={productForm.availability ? "true" : "false"} onChange={e => setProductForm({ ...productForm, availability: e.target.value === "true" })}>
                <option value="true">Active & Visible</option>
                <option value="false">Hidden / Draft</option>
              </select>
            </div>
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

          <div className="border-t border-border-custom my-4" />

          <h3 className="text-sm font-semibold text-text-primary mb-2">Product Variants ({modalVariants.length})</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-50/50 p-4 rounded-lg border border-border-custom">
            {/* Add Variant Form */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h4 className="text-[13px] font-semibold text-text-primary">Add Variant</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-text-primary mb-1">Color *</label>
                  <select className="w-full bg-white border border-border-custom rounded px-3 py-1.5 text-xs focus:outline-none focus:border-accent" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })}>
                    <option value="">Select Color</option>
                    {colors.map(c => <option key={c._id} value={c._id}>{c.name} ({c.hex})</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-text-primary mb-1">Size *</label>
                  <select className="w-full bg-white border border-border-custom rounded px-3 py-1.5 text-xs focus:outline-none focus:border-accent" value={variantForm.size} onChange={e => setVariantForm({ ...variantForm, size: e.target.value })}>
                    <option value="">Select Size</option>
                    {sizes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-text-secondary bg-gray-100 p-2.5 rounded border border-border-custom font-medium">
                Pricing details will automatically inherit the product's Base Price (₹{productForm.price || 350})
                {productForm.salePrice ? ` and Discounted Price (₹${productForm.salePrice})` : ""}.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Stock Qty *" size="sm" type="number" value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: e.target.value })} />
                <Input label="Weight (g) *" size="sm" type="number" value={variantForm.weight} onChange={e => setVariantForm({ ...variantForm, weight: e.target.value })} />
              </div>

              <Input label="Variant SKU" size="sm" value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} placeholder="e.g. AUR-TR-XS-BLK" />

              <div className="flex flex-col gap-2 border-t border-border-custom pt-2">
                <label className="block text-xs font-semibold text-text-primary">Variant Images</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {(variantForm.images ? variantForm.images.split(",").map(i => i.trim()).filter(Boolean) : []).map((img, idx) => (
                    <div key={idx} className="relative w-16 h-20 flex-shrink-0 border border-border-custom rounded overflow-hidden bg-gray-50 group">
                      <img 
                        src={resolveImage(img)} 
                        alt={`Variant Preview ${idx + 1}`} 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => window.open(resolveImage(img), '_blank')}
                        title="Click to view full size"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const imgs = variantForm.images.split(",").map(i => i.trim()).filter(Boolean);
                          imgs.splice(idx, 1);
                          setVariantForm({ ...variantForm, images: imgs.join(", ") });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-md z-10 hover:bg-red-600 focus:outline-none"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-20 flex-shrink-0 border border-dashed border-gray-300 hover:border-accent rounded flex flex-col items-center justify-center cursor-pointer text-text-secondary bg-gray-50 text-[10px] gap-1 transition-colors">
                    <ImageIcon size={14} />
                    <span>Upload</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {uploadingImages && <p className="text-[10px] text-accent">Uploading images...</p>}
                
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="showcaseCheckbox"
                    checked={variantForm.showcase || false}
                    onChange={e => setVariantForm({ ...variantForm, showcase: e.target.checked })}
                    className="w-3.5 h-3.5 accent-accent cursor-pointer"
                  />
                  <label htmlFor="showcaseCheckbox" className="text-xs font-medium text-text-secondary cursor-pointer select-none">
                    Showcase this variant's image on product page
                  </label>
                </div>
              </div>

              <Button type="button" onClick={handleModalAddVariant} size="sm" className="mt-2 w-full">
                {editingVariantIndex !== null ? "Save Variant Changes" : "Add Variant to List"}
              </Button>
              {editingVariantIndex !== null && (
                <Button 
                  type="button" 
                  onClick={() => {
                    setEditingVariantIndex(null);
                    setVariantForm(prev => ({
                      ...prev,
                      sku: `${productForm.sku}-VAR-${Date.now().toString().slice(-4)}`,
                      images: "",
                      showcase: false
                    }));
                  }} 
                  variant="secondary" 
                  size="sm" 
                  className="mt-1 w-full"
                >
                  Cancel Edit
                </Button>
              )}
            </div>

            {/* Variants List Table */}
            <div className="lg:col-span-7 flex flex-col">
              <h4 className="text-[13px] font-semibold text-text-primary mb-2">Variant List</h4>
              {modalVariants.length > 0 ? (
                <div className="max-h-[260px] overflow-y-auto border border-border-custom rounded-md bg-white">
                  <table className="min-w-full divide-y divide-border-custom text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Color/Size</th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">SKU</th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Price</th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Stock</th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Weight</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom bg-white">
                      {modalVariants.map((v, idx) => {
                        const colorName = v.colorDetails?.name || v.color?.name || colors.find(c => c._id === (v.color?._id || v.color))?.name || "—";
                        const sizeName = v.sizeDetails?.name || v.size?.name || sizes.find(s => s._id === (v.size?._id || v.size))?.name || "—";
                        const sellingPrice = v.prices?.sellingPrice || v.price || 0;
                        return (
                          <tr key={v._id || idx}>
                            <td className="px-3 py-2">
                              <p className="font-semibold">{sizeName}</p>
                              <p className="text-text-secondary text-[10px]">{colorName}</p>
                            </td>
                            <td className="px-3 py-2 font-mono text-[10px]">{v.sku}</td>
                            <td className="px-3 py-2 font-medium">₹{sellingPrice}</td>
                            <td className="px-3 py-2">{v.stock}</td>
                            <td className="px-3 py-2">{v.weight}g</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setVariantForm({
                                    color: v.color?._id || v.color || "",
                                    size: v.size?._id || v.size || "",
                                    sku: v.sku || "",
                                    stock: v.stock || 0,
                                    weight: v.weight || 300,
                                    mrp: v.prices?.mrp || 350,
                                    sellingPrice: v.prices?.sellingPrice || 350,
                                    costPrice: v.prices?.costPrice || 150,
                                    images: v.images ? (Array.isArray(v.images) ? v.images.filter(i => i && i !== "/images/products/placeholder.jpg").join(", ") : v.images) : "",
                                    showcase: v.showcase || false
                                  });
                                  setEditingVariantIndex(idx);
                                }}
                                className="text-accent hover:text-blue-700 font-semibold focus:outline-none mr-3"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModalRemoveVariant(v._id || idx, !!v._id)}
                                className="text-danger hover:text-red-700 font-semibold focus:outline-none"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 border border-dashed border-gray-300 rounded-md flex items-center justify-center p-6 text-center text-text-muted text-xs bg-white">
                  No variants added yet. Use the form to add variants.
                </div>
              )}
            </div>
          </div>

          {/* Hidden submit button to trigger form submission via footer button */}
          <button type="submit" className="hidden" />
        </form>
      </Modal>
    </div>
  );
}
