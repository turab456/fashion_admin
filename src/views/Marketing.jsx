import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Image as ImageIcon, Copy, Play, Pause, AlertCircle, BarChart3, Megaphone, X } from "lucide-react";
import { api } from "../services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("campaigns"); // "campaigns" or "analytics"
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "popup",
    status: "Draft",
    priority: 0,
    description: "",
    content: {
      title: "",
      subtitle: "",
      promoDescription: "",
      productImage: "",
      productName: "",
      couponCode: "",
      discountLabel: "",
      buttonText: "Shop Now",
      redirectUrl: ""
    },
    frequency: {
      frequencyType: "Session",
      maxImpressions: 0
    },
    displayRules: {
      trigger: "OnLoad",
      delaySeconds: 0
    }
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.marketing.getCampaigns();
      setCampaigns(res.data);
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "popup",
      status: "Draft",
      priority: 0,
      description: "",
      content: {
        title: "", subtitle: "", promoDescription: "", productImage: "",
        productName: "", couponCode: "", discountLabel: "", buttonText: "Shop Now", redirectUrl: ""
      },
      frequency: { frequencyType: "Session", maxImpressions: 0 },
      displayRules: { trigger: "OnLoad", delaySeconds: 0 }
    });
    setImageFile(null);
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (c) => {
    setForm({
      name: c.name || "",
      type: c.type || "popup",
      status: c.status || "Draft",
      priority: c.priority || 0,
      description: c.description || "",
      content: {
        title: c.content?.title || "",
        subtitle: c.content?.subtitle || "",
        promoDescription: c.content?.promoDescription || "",
        productImage: c.content?.productImage || "",
        productName: c.content?.productName || "",
        couponCode: c.content?.couponCode || "",
        discountLabel: c.content?.discountLabel || "",
        buttonText: c.content?.buttonText || "Shop Now",
        redirectUrl: c.content?.redirectUrl || ""
      },
      frequency: {
        frequencyType: c.frequency?.frequencyType || "Session",
        maxImpressions: c.frequency?.maxImpressions || 0
      },
      displayRules: {
        trigger: c.displayRules?.trigger || "OnLoad",
        delaySeconds: c.displayRules?.delaySeconds || 0
      }
    });
    setEditingId(c._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.marketing.deleteCampaign(id);
      fetchCampaigns();
    } catch (err) {
      alert("Failed to delete campaign");
    }
  };

  const handleToggleStatus = async (c) => {
    try {
      const newStatus = c.status === "Active" ? "Paused" : "Active";
      await api.marketing.updateCampaign(c._id, { status: newStatus });
      fetchCampaigns();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Image = reader.result;
          const data = await api.products.upload(base64Image);
          if (data.data?.url) {
            setForm(prev => ({
              ...prev,
              content: { ...prev.content, productImage: data.data.url }
            }));
          }
        } catch (err) {
          alert("Failed to upload image");
        } finally {
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        alert("Failed to read file");
        setUploadingImage(false);
      };
    } catch (err) {
      alert("Failed to upload image");
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.marketing.updateCampaign(editingId, form);
      } else {
        await api.marketing.createCampaign(form);
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      alert(err.message || "Failed to save campaign");
    }
  };

  const renderDashboard = () => {
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.analytics?.impressions || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.analytics?.clicks || 0), 0);
    const activeCount = campaigns.filter(c => c.status === "Active").length;
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

    const chartData = campaigns.map(c => ({
      name: c.name,
      impressions: c.analytics?.impressions || 0,
      clicks: c.analytics?.clicks || 0
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <h4 className="text-xs uppercase text-text-secondary font-semibold">Active Campaigns</h4>
            <p className="text-2xl font-bold text-text-primary mt-2">{activeCount}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-xs uppercase text-text-secondary font-semibold">Total Impressions</h4>
            <p className="text-2xl font-bold text-text-primary mt-2">{totalImpressions}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-xs uppercase text-text-secondary font-semibold">Total Clicks</h4>
            <p className="text-2xl font-bold text-text-primary mt-2">{totalClicks}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-xs uppercase text-text-secondary font-semibold">Avg CTR</h4>
            <p className="text-2xl font-bold text-text-primary mt-2">{avgCTR}%</p>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4 text-text-primary uppercase tracking-widest">Campaign Performance</h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={10} />
                <RechartsTooltip />
                <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Geographic Analytics */}
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-border-custom">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-widest">Geographic Performance</h3>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <Table className="border-0 rounded-none">
              <TableHeader>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
              </TableHeader>
              <TableBody>
                {(() => {
                  const geoData = {};
                  campaigns.forEach(c => {
                    if (c.analytics?.regions) {
                      c.analytics.regions.forEach(r => {
                        const key = `${r.country}-${r.region}-${r.city}`;
                        if (!geoData[key]) {
                          geoData[key] = { country: r.country, region: r.region, city: r.city, impressions: 0, clicks: 0 };
                        }
                        geoData[key].impressions += r.impressions || 0;
                        geoData[key].clicks += r.clicks || 0;
                      });
                    }
                  });
                  const geoList = Object.values(geoData).sort((a, b) => b.impressions - a.impressions);
                  
                  if (geoList.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-text-muted py-8 uppercase tracking-widest text-xs">No geographic data available yet.</TableCell>
                      </TableRow>
                    );
                  }

                  return geoList.map((loc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-text-primary">
                        {loc.city ? `${loc.city}, ` : ''}{loc.region ? `${loc.region}, ` : ''}{loc.country || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right text-text-secondary">{loc.impressions}</TableCell>
                      <TableCell className="text-right text-text-secondary">{loc.clicks}</TableCell>
                      <TableCell className="text-right text-text-secondary">
                        {loc.impressions > 0 ? ((loc.clicks / loc.impressions) * 100).toFixed(2) : "0.00"}%
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="pb-12 space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <PageHeader
          title="Promotional Campaigns"
          subtitle="Marketing Engine"
          icon={Megaphone}
        />
        <Button
          onClick={handleOpenNew}
          variant="primary"
          className="uppercase tracking-widest text-[11px]"
        >
          <Plus size={14} className="mr-2" /> New Campaign
        </Button>
      </div>

      <div className="flex border-b border-border-custom gap-6 select-none overflow-x-auto pb-0 mb-8">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-4 px-1 text-xs uppercase tracking-widest font-semibold flex items-center gap-2 border-b-2 transition-all duration-300 focus:outline-none ${
            activeTab === "campaigns"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <span>CAMPAIGN LIST</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-4 px-1 text-xs uppercase tracking-widest font-semibold flex items-center gap-2 border-b-2 transition-all duration-300 focus:outline-none ${
            activeTab === "analytics"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>ANALYTICS</span>
        </button>
      </div>

      {activeTab === "analytics" ? renderDashboard() : (
        <Card className="p-0 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <Table className="border-0 rounded-none">
              <TableHeader>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metrics</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-text-muted uppercase tracking-widest text-xs">Loading campaigns...</TableCell></TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-text-muted uppercase tracking-widest text-xs">No campaigns found. Create one to get started.</TableCell></TableRow>
                ) : (
                  campaigns.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>
                        <p className="font-semibold text-text-primary uppercase text-[11px] tracking-widest">{c.name}</p>
                        {c.content?.couponCode && <p className="text-[10px] font-mono text-text-muted mt-1">CODE: {c.content.couponCode}</p>}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] uppercase font-mono tracking-wider border border-border-custom px-2 py-1 bg-background-light">
                          {c.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.status === "Active" ? <Badge variant="success">Active</Badge> :
                         c.status === "Paused" ? <Badge variant="warning">Paused</Badge> :
                         c.status === "Draft" ? <Badge variant="secondary">Draft</Badge> :
                         <Badge variant="danger">{c.status}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] uppercase font-mono text-text-secondary space-y-1 tracking-wider">
                          <p>Views: <span className="font-semibold text-text-primary">{c.analytics?.impressions || 0}</span></p>
                          <p>Clicks: <span className="font-semibold text-text-primary">{c.analytics?.clicks || 0}</span></p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleToggleStatus(c)} title={c.status === "Active" ? "Pause" : "Activate"} className="px-2">
                            {c.status === "Active" ? <Pause size={14} /> : <Play size={14} />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(c)} title="Edit" className="px-2">
                            <Edit3 size={14} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(c._id)} title="Delete" className="text-danger border-danger-light hover:bg-danger hover:text-white px-2">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Campaign" : "New Campaign"}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="bg-white p-6 border border-border-custom rounded shadow-sm">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-4">Basic Info</h4>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Campaign Name *"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Sale 2026"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="popup">Popup</option>
                    <option value="banner" disabled>Banner (Coming Soon)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <Input
                  label="Priority (Higher overrides lower)"
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Content */}
            <div className="bg-white p-6 border border-border-custom rounded shadow-sm">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-4">Promotional Content</h4>
              
              <div className="mb-6">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider block mb-2">Product/Promo Image (Optional)</label>
                <div className="flex items-center gap-4">
                  {form.content.productImage ? (
                    <div className="relative w-24 h-24 border border-border-custom rounded overflow-hidden group">
                      <img src={form.content.productImage} alt="Promo" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm({ ...form, content: { ...form.content, productImage: "" } })} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest font-semibold">Remove</button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border border-dashed border-border-custom rounded flex items-center justify-center text-text-muted bg-background-light">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="promo-image-upload" />
                    <label htmlFor="promo-image-upload" className="cursor-pointer border border-border-custom px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-primary hover:border-accent hover:text-accent transition-colors rounded">
                      {uploadingImage ? "Uploading..." : "Choose Image"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Title"
                  value={form.content.title}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, title: e.target.value } })}
                  placeholder="e.g. GET 20% OFF"
                />
                <Input
                  label="Subtitle / Discount Label"
                  value={form.content.subtitle}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, subtitle: e.target.value } })}
                  placeholder="e.g. On your first order"
                />
                <div className="col-span-2">
                  <Input
                    label="Description"
                    value={form.content.promoDescription}
                    onChange={(e) => setForm({ ...form, content: { ...form.content, promoDescription: e.target.value } })}
                    placeholder="Sign up for our newsletter and get an exclusive discount code..."
                    multiline
                    rows={3}
                  />
                </div>
                <Input
                  label="Coupon Code (Optional)"
                  value={form.content.couponCode}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, couponCode: e.target.value } })}
                  placeholder="e.g. WELCOME20"
                  className="uppercase font-mono"
                />
                <Input
                  label="CTA Redirect URL"
                  value={form.content.redirectUrl}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, redirectUrl: e.target.value } })}
                  placeholder="e.g. /shop"
                  className="font-mono"
                />
                <Input
                  label="CTA Button Text"
                  value={form.content.buttonText}
                  onChange={(e) => setForm({ ...form, content: { ...form.content, buttonText: e.target.value } })}
                  placeholder="e.g. Shop Now"
                  className="uppercase"
                />
              </div>
            </div>

            {/* Display & Frequency Rules */}
            <div className="bg-white p-6 border border-border-custom rounded shadow-sm mt-6">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-4">Display Rules</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Trigger</label>
                  <select
                    value={form.displayRules.trigger}
                    onChange={(e) => setForm({ ...form, displayRules: { ...form.displayRules, trigger: e.target.value } })}
                    className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="OnLoad">On Page Load</option>
                    <option value="ExitIntent" disabled>Exit Intent (Coming soon)</option>
                    <option value="Scroll" disabled>Scroll % (Coming soon)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Frequency</label>
                  <select
                    value={form.frequency.frequencyType}
                    onChange={(e) => setForm({ ...form, frequency: { ...form.frequency, frequencyType: e.target.value } })}
                    className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="Once">Show Once Ever</option>
                    <option value="Session">Show Once Per Session</option>
                    <option value="Daily">Show Once Daily</option>
                    <option value="Always">Show Always (Every Load)</option>
                  </select>
                </div>
              </div>
            </div>

          </form>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-border-custom">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="campaign-form">
              Save Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
