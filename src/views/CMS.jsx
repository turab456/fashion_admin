import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, Trash2, Edit2, X, Save, FileText, Image as ImageIcon, HelpCircle, LayoutDashboard } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

const resolveImage = (url) => {
  if (!url) return "";
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

const TAB_SECTIONS = "sections";
const TAB_BANNERS = "banners";
const TAB_FAQS = "faqs";
const TAB_PAGES = "pages";

const SECTION_KEYS = [
  { key: "hero", label: "Hero Banner" },
  { key: "featured-collections", label: "Featured Collections" },
  { key: "new-arrivals", label: "New Arrivals" },
  { key: "best-sellers", label: "Best Sellers" },
  { key: "campaign-banner", label: "Campaign Banner" },
  { key: "shop-by-category", label: "Shop by Category" },
  { key: "customer-favorites", label: "Customer Favorites" },
  { key: "instagram-gallery", label: "Instagram Gallery" },
  { key: "brand-story", label: "Brand Story" },
  { key: "newsletter", label: "Newsletter" },
];

const POSITIONS = ["Hero", "Collection", "Category", "Offer", "Festival", "Popup"];
const FAQ_CATS = ["General", "Shipping", "Refunds", "Sizing"];

export default function CMS() {
  const [activeTab, setActiveTab] = useState(TAB_SECTIONS);

  // -- Homepage Sections --
  const [sections, setSections] = useState([]);
  const [sectionForm, setSectionForm] = useState({ sectionKey: "hero", title: "", subtitle: "", sortOrder: 0, isEnabled: true });
  const [editSection, setEditSection] = useState(null);
  const [showSectionModal, setShowSectionModal] = useState(false);

  // -- Banners --
  const [banners, setBanners] = useState([]);
  const [bannerForm, setBannerForm] = useState({ name: "", position: "Hero", desktopImage: "", ctaLink: "", status: "Active" });
  const [editBanner, setEditBanner] = useState(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  // -- FAQs --
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "General", sortOrder: 0 });
  const [editFaq, setEditFaq] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const [pages, setPages] = useState([]);
  const [pageForm, setPageForm] = useState({ title: "", slug: "", content: "", status: "Active" });
  const [editPage, setEditPage] = useState(null);
  const [showPageModal, setShowPageModal] = useState(false);

  // -- Products (for sections) --
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBannerImage(true);
    try {
      const base64 = await toBase64(file);
      const res = await api.products.upload(base64);
      if (res.data?.url) {
        setBannerForm(prev => ({ ...prev, desktopImage: res.data.url }));
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to upload banner image.");
    } finally {
      setUploadingBannerImage(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, b, f, p, prods] = await Promise.all([
        api.cms.getHomepageSections(),
        api.cms.getBanners(),
        api.cms.getFAQs(),
        api.cms.getPages(),
        api.products.list({ limit: 100 }),
      ]);
      setSections(s.data || []);
      setBanners(b.data || []);
      setFaqs(f.data || []);
      setPages(p.data || []);
      setProducts(prods.data || []);
    } catch (err) {
      console.error("Failed to load CMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- SECTION HANDLERS ---
  const openAddSection = () => {
    setEditSection(null);
    setSectionForm({ sectionKey: "hero", title: "", subtitle: "", sortOrder: 0, isEnabled: true, content: { items: [] } });
    setShowSectionModal(true);
  };

  const openEditSection = (s) => {
    setEditSection(s);
    setSectionForm({ 
      sectionKey: s.sectionKey, 
      title: s.title || "", 
      subtitle: s.subtitle || "", 
      sortOrder: s.sortOrder || 0, 
      isEnabled: s.isEnabled !== false,
      content: s.content || { items: [] }
    });
    setShowSectionModal(true);
  };

  const saveSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.cms.configureHomepageSection(sectionForm.sectionKey, {
        sectionKey: sectionForm.sectionKey,
        title: sectionForm.title,
        subtitle: sectionForm.subtitle,
        sortOrder: sectionForm.sortOrder,
        isEnabled: sectionForm.isEnabled,
        content: sectionForm.content,
      });
      setShowSectionModal(false);
      loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  // --- BANNER HANDLERS ---
  const openAddBanner = () => {
    setEditBanner(null);
    setBannerForm({ name: "", position: "Hero", desktopImage: "", ctaLink: "", status: "Active" });
    setShowBannerModal(true);
  };

  const openEditBanner = (b) => {
    setEditBanner(b);
    setBannerForm({ name: b.name, position: b.position, desktopImage: b.desktopImage, ctaLink: b.ctaLink || "", status: b.status });
    setShowBannerModal(true);
  };

  const saveBanner = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editBanner) {
        await api.cms.updateBanner(editBanner._id, bannerForm);
      } else {
        await api.cms.createBanner(bannerForm);
      }
      setShowBannerModal(false);
      loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    await api.cms.deleteBanner(id);
    loadAll();
  };

  // --- FAQ HANDLERS ---
  const openAddFaq = () => {
    setEditFaq(null);
    setFaqForm({ question: "", answer: "", category: "General", sortOrder: 0 });
    setShowFaqModal(true);
  };

  const openEditFaq = (f) => {
    setEditFaq(f);
    setFaqForm({ question: f.question, answer: f.answer, category: f.category, sortOrder: f.sortOrder });
    setShowFaqModal(true);
  };

  const saveFaq = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editFaq) {
        await api.cms.updateFAQ(editFaq._id, faqForm);
      } else {
        await api.cms.createFAQ(faqForm);
      }
      setShowFaqModal(false);
      loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteFaq = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    await api.cms.deleteFAQ(id);
    loadAll();
  };

  // --- PAGE HANDLERS ---
  const openAddPage = () => {
    setEditPage(null);
    setPageForm({ title: "", slug: "", content: "", status: "Active" });
    setShowPageModal(true);
  };

  const openEditPage = (p) => {
    setEditPage(p);
    setPageForm({ title: p.title, slug: p.slug, content: p.content, status: p.status });
    setShowPageModal(true);
  };

  const savePage = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editPage) {
        await api.cms.updatePage(editPage._id, pageForm);
      } else {
        await api.cms.createPage(pageForm);
      }
      setShowPageModal(false);
      loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deletePage = async (id) => {
    if (!window.confirm("Delete this page?")) return;
    await api.cms.deletePage(id);
    loadAll();
  };

  const tabs = [
    { id: TAB_SECTIONS, label: "Homepage Sections", icon: <LayoutDashboard size={14} /> },
    { id: TAB_BANNERS, label: "Banners", icon: <ImageIcon size={14} /> },
    { id: TAB_FAQS, label: "FAQs", icon: <HelpCircle size={14} /> },
    { id: TAB_PAGES, label: "CMS Pages", icon: <FileText size={14} /> },
  ];

  return (
    <div className="pb-12 space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <PageHeader
          title="Content Management"
          subtitle="Manage homepage sections, banners, FAQs, and CMS pages"
          icon={LayoutDashboard}
        />
        
        {activeTab === TAB_SECTIONS && (
          <Button onClick={openAddSection} variant="primary" className="uppercase tracking-widest text-[11px]">
            <Plus size={14} className="mr-2" /> Add Section
          </Button>
        )}
        {activeTab === TAB_BANNERS && (
          <Button onClick={openAddBanner} variant="primary" className="uppercase tracking-widest text-[11px]">
            <Plus size={14} className="mr-2" /> Add Banner
          </Button>
        )}
        {activeTab === TAB_FAQS && (
          <Button onClick={openAddFaq} variant="primary" className="uppercase tracking-widest text-[11px]">
            <Plus size={14} className="mr-2" /> Add FAQ
          </Button>
        )}
        {activeTab === TAB_PAGES && (
          <Button onClick={openAddPage} variant="primary" className="uppercase tracking-widest text-[11px]">
            <Plus size={14} className="mr-2" /> Add Page
          </Button>
        )}
      </div>

      <div className="flex border-b border-border-custom gap-6 select-none overflow-x-auto pb-0 mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-4 px-1 text-xs uppercase tracking-widest font-semibold flex items-center gap-2 border-b-2 transition-all duration-300 focus:outline-none ${
              activeTab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs uppercase tracking-widest text-text-muted">Loading...</div>
      ) : (
        <>
          {/* ===== HOMEPAGE SECTIONS TAB ===== */}
          {activeTab === TAB_SECTIONS && (
            <Card className="p-0 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableHead>Section Key</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subtitle</TableHead>
                    <TableHead className="text-center">Order</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeader>
                  <TableBody>
                    {sections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-text-muted uppercase tracking-widest text-xs">No homepage sections configured yet.</TableCell>
                      </TableRow>
                    ) : sections.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(s => (
                      <TableRow key={s._id}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-accent uppercase bg-accent-light/10 px-2 py-0.5 border border-accent/20 rounded">
                            {s.sectionKey}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-text-primary text-[13px]">{s.title || "—"}</TableCell>
                        <TableCell className="text-[12px] text-text-secondary truncate max-w-[200px]">{s.subtitle || "—"}</TableCell>
                        <TableCell className="text-center text-[13px] text-text-secondary">{s.sortOrder || 0}</TableCell>
                        <TableCell>
                          {s.isEnabled ? <Badge variant="success">Yes</Badge> : <Badge variant="danger">No</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditSection(s)} title="Edit" className="px-2">
                              <Edit2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ===== BANNERS TAB ===== */}
          {activeTab === TAB_BANNERS && (
            <Card className="p-0 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableHead>Preview</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>CTA Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeader>
                  <TableBody>
                    {banners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-text-muted uppercase tracking-widest text-xs">No banners yet.</TableCell>
                      </TableRow>
                    ) : banners.map(b => (
                      <TableRow key={b._id}>
                        <TableCell>
                          {b.desktopImage ? (
                            <img src={resolveImage(b.desktopImage)} alt={b.name} className="w-16 h-10 object-cover rounded border border-border-custom" />
                          ) : (
                            <div className="w-16 h-10 bg-background-light rounded border border-dashed border-border-custom flex items-center justify-center text-[10px] text-text-muted">No Image</div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-text-primary text-[13px]">{b.name}</TableCell>
                        <TableCell>
                          <Badge variant="primary">{b.position}</Badge>
                        </TableCell>
                        <TableCell className="text-[12px] text-text-secondary font-mono truncate max-w-[150px]">{b.ctaLink || "—"}</TableCell>
                        <TableCell>
                          {b.status === "Active" ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">{b.status}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditBanner(b)} title="Edit" className="px-2">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteBanner(b._id)} title="Delete" className="text-danger border-danger-light hover:bg-danger hover:text-white px-2">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ===== FAQs TAB ===== */}
          {activeTab === TAB_FAQS && (
            <Card className="p-0 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeader>
                  <TableBody>
                    {faqs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-text-muted uppercase tracking-widest text-xs">No FAQs yet.</TableCell>
                      </TableRow>
                    ) : faqs.map(f => (
                      <TableRow key={f._id}>
                        <TableCell className="max-w-md">
                          <p className="font-medium text-text-primary text-[13px]">{f.question}</p>
                          <p className="text-[12px] text-text-secondary mt-1 truncate">{f.answer}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{f.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {f.status === "Active" ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">{f.status}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditFaq(f)} title="Edit" className="px-2">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteFaq(f._id)} title="Delete" className="text-danger border-danger-light hover:bg-danger hover:text-white px-2">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ===== PAGES TAB ===== */}
          {activeTab === TAB_PAGES && (
            <Card className="p-0 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeader>
                  <TableBody>
                    {pages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-text-muted uppercase tracking-widest text-xs">No pages yet.</TableCell>
                      </TableRow>
                    ) : pages.map(p => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium text-text-primary text-[13px]">{p.title}</TableCell>
                        <TableCell className="text-[12px] font-mono text-text-secondary">/{p.slug}</TableCell>
                        <TableCell>
                          {p.status === "Active" ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">{p.status}</Badge>}
                        </TableCell>
                        <TableCell className="text-[12px] text-text-secondary">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditPage(p)} title="Edit" className="px-2">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deletePage(p._id)} title="Delete" className="text-danger border-danger-light hover:bg-danger hover:text-white px-2">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* --- BANNER MODAL --- */}
      <Modal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        title={editBanner ? "Edit Banner" : "Add Banner"}
        maxWidth="max-w-xl"
      >
        <div className="space-y-6">
          <form id="banner-form" onSubmit={saveBanner} className="space-y-6">
            <Input
              label="Banner Name *"
              required
              value={bannerForm.name}
              onChange={e => setBannerForm({ ...bannerForm, name: e.target.value })}
              placeholder="Summer Sale Hero Banner"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Position *</label>
                <select
                  value={bannerForm.position}
                  onChange={e => setBannerForm({ ...bannerForm, position: e.target.value })}
                  className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Status</label>
                <select
                  value={bannerForm.status}
                  onChange={e => setBannerForm({ ...bannerForm, status: e.target.value })}
                  className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider block mb-2">Desktop Image *</label>
              <div className="flex items-center gap-4 mb-4">
                {bannerForm.desktopImage ? (
                  <div className="relative w-32 h-16 border border-border-custom rounded overflow-hidden">
                    <img src={resolveImage(bannerForm.desktopImage)} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-16 border border-dashed border-border-custom rounded flex items-center justify-center bg-background-light text-[10px] text-text-muted">
                    No image
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" id="banner-image-upload" />
                  <label htmlFor="banner-image-upload" className="cursor-pointer border border-border-custom px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-primary hover:border-accent hover:text-accent transition-colors rounded">
                    {uploadingBannerImage ? "Uploading..." : "Choose Image"}
                  </label>
                </div>
              </div>
              <Input
                required
                value={bannerForm.desktopImage}
                onChange={e => setBannerForm({ ...bannerForm, desktopImage: e.target.value })}
                placeholder="Or paste desktop image URL..."
              />
            </div>
            <Input
              label="CTA Link"
              value={bannerForm.ctaLink}
              onChange={e => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
              placeholder="/shop?category=sale"
            />
          </form>
          <div className="flex justify-end gap-2 pt-4 border-t border-border-custom">
            <Button variant="secondary" onClick={() => setShowBannerModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="banner-form" disabled={saving}>
              <Save size={14} className="mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- FAQ MODAL --- */}
      <Modal
        isOpen={showFaqModal}
        onClose={() => setShowFaqModal(false)}
        title={editFaq ? "Edit FAQ" : "Add FAQ"}
        maxWidth="max-w-xl"
      >
        <div className="space-y-6">
          <form id="faq-form" onSubmit={saveFaq} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Category</label>
              <select
                value={faqForm.category}
                onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}
                className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                {FAQ_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Input
              label="Question *"
              required
              value={faqForm.question}
              onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
              placeholder="What is your return policy?"
            />
            <Input
              label="Answer *"
              required
              multiline
              rows={4}
              value={faqForm.answer}
              onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
              placeholder="We offer a 30-day return policy..."
            />
            <Input
              label="Sort Order"
              type="number"
              value={faqForm.sortOrder}
              onChange={e => setFaqForm({ ...faqForm, sortOrder: Number(e.target.value) })}
              placeholder="0"
            />
          </form>
          <div className="flex justify-end gap-2 pt-4 border-t border-border-custom">
            <Button variant="secondary" onClick={() => setShowFaqModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="faq-form" disabled={saving}>
              <Save size={14} className="mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- PAGE MODAL --- */}
      <Modal
        isOpen={showPageModal}
        onClose={() => setShowPageModal(false)}
        title={editPage ? "Edit Page" : "Add Page"}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <form id="page-form" onSubmit={savePage} className="space-y-6">
            <Input
              label="Page Title *"
              required
              value={pageForm.title}
              onChange={e => setPageForm({ ...pageForm, title: e.target.value })}
              placeholder="Privacy Policy"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="URL Slug *"
                required
                value={pageForm.slug}
                onChange={e => setPageForm({ ...pageForm, slug: e.target.value })}
                placeholder="privacy-policy"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Status</label>
                <select
                  value={pageForm.status}
                  onChange={e => setPageForm({ ...pageForm, status: e.target.value })}
                  className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <Input
              label="Content (HTML/Markdown) *"
              required
              multiline
              rows={8}
              value={pageForm.content}
              onChange={e => setPageForm({ ...pageForm, content: e.target.value })}
              placeholder="# Privacy Policy\n\nYour content here..."
              className="font-mono text-xs"
            />
          </form>
          <div className="flex justify-end gap-2 pt-4 border-t border-border-custom">
            <Button variant="secondary" onClick={() => setShowPageModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="page-form" disabled={saving}>
              <Save size={14} className="mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- HOMEPAGE SECTION MODAL --- */}
      <Modal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        title={editSection ? "Edit Homepage Section" : "Add Homepage Section"}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <form id="section-form" onSubmit={saveSection} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Section Key *</label>
              {editSection ? (
                <input disabled value={sectionForm.sectionKey} className="w-full bg-background-light border border-border-custom rounded px-3 py-2 text-sm cursor-not-allowed text-text-muted" />
              ) : (
                <select
                  value={sectionForm.sectionKey}
                  onChange={e => setSectionForm({ ...sectionForm, sectionKey: e.target.value })}
                  className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  {SECTION_KEYS.map(sk => (
                    <option key={sk.key} value={sk.key}>{sk.label} ({sk.key})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Section Title *"
                required
                value={sectionForm.title}
                onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="e.g. New Arrivals"
              />
              <Input
                label="Subtitle"
                value={sectionForm.subtitle}
                onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                placeholder="e.g. Seasonal Drop"
              />
              <Input
                label="Sort Order"
                type="number"
                value={sectionForm.sortOrder}
                onChange={e => setSectionForm({ ...sectionForm, sortOrder: Number(e.target.value) })}
                placeholder="0"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Enabled</label>
                <select
                  value={sectionForm.isEnabled ? "true" : "false"}
                  onChange={e => setSectionForm({ ...sectionForm, isEnabled: e.target.value === "true" })}
                  className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="true">Yes — Visible</option>
                  <option value="false">No — Hidden</option>
                </select>
              </div>
            </div>

            {/* Product Selection for Grid Sections */}
            {['new-arrivals', 'best-sellers', 'customer-favorites'].includes(sectionForm.sectionKey) && (
              <div className="pt-4 border-t border-border-custom mt-4">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-text-primary block mb-2">Manually Select Products (Optional)</label>
                <p className="text-xs text-text-secondary mb-4">
                  If left empty, the storefront will automatically load dynamic products based on its logic. 
                  Select up to 4 products to override this behavior.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map(index => {
                    const prodRef = sectionForm.content?.items?.[index]?.product;
                    const selectedId = prodRef?._id || prodRef || "";
                    return (
                      <div key={index} className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Slot {index + 1}</label>
                        <select 
                          value={selectedId}
                          onChange={(e) => {
                             const newItems = [...(sectionForm.content?.items || [])];
                             while(newItems.length <= index) newItems.push({ product: null });
                             newItems[index] = { product: e.target.value || null };
                             setSectionForm({...sectionForm, content: { ...sectionForm.content, items: newItems }});
                          }}
                          className="w-full bg-white border border-border-custom rounded px-3 py-2 text-xs focus:outline-none focus:border-accent"
                        >
                          <option value="">-- Auto / None --</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
          <div className="flex justify-end gap-2 pt-4 border-t border-border-custom">
            <Button variant="secondary" onClick={() => setShowSectionModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="section-form" disabled={saving}>
              <Save size={14} className="mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
