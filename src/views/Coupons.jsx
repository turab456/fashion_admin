import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, Trash2, Calendar, Tag, Percent, DollarSign, Clock, AlertCircle } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);
      const res = await api.coupons.list();
      setCoupons(res.data || []);
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim() || !expiryDate) return;
    setSubmitting(true);

    try {
      await api.coupons.create({
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        expiryDate
      });
      alert("Discount coupon created successfully!");
      setCode("");
      setDiscountType("percentage");
      setDiscountValue(10);
      setMinOrderAmount(0);
      setExpiryDate("");
      loadCoupons();
    } catch (err) {
      alert(err.message || "Failed to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Archive and delete this coupon? Users will no longer be able to apply it.")) return;
    try {
      await api.coupons.delete(id);
      loadCoupons();
    } catch (err) {
      alert(err.message || "Failed to delete coupon.");
    }
  };

  const isExpired = (expiryStr) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <PageHeader
        title="Discount Coupons"
        subtitle="Marketing & Promotions Configuration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Coupon Form (Left, 5 cols) */}
        <div className="lg:col-span-5">
          <Card>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary mb-6 pb-2 border-b border-border-custom flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              <span>Generate Promo Code</span>
            </h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <Input
                label="Coupon Code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="E.g., WELCOME15"
                className="uppercase font-mono"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Rate (₹)</option>
                  </select>
                </div>
                <Input
                  label="Discount Value"
                  type="number"
                  required
                  min={1}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  icon={discountType === "percentage" ? Percent : DollarSign}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min. Subtotal (₹)"
                  type="number"
                  required
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-2"
                size="lg"
              >
                {submitting ? "Writing Promo..." : "Register Coupon"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Existing Coupons list (Right, 7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 pb-2 border-b border-border-custom">
              <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary">
                Active Promo Codes ({coupons.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center text-xs uppercase tracking-widest text-text-secondary py-16 select-none">
                Retrieving promotional details...
              </div>
            ) : coupons.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto">
                <Table className="border-0 rounded-none">
                  <TableHeader>
                    <TableHead>Promo Code</TableHead>
                    <TableHead>Price Reduction</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Valid Through</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => {
                      const expired = isExpired(coupon.expiryDate);
                      return (
                        <TableRow key={coupon._id} className={expired ? "opacity-40" : ""}>
                          <TableCell>
                            <span className="font-mono text-xs font-bold text-accent uppercase bg-accent-light/10 px-2 py-0.5 border border-accent/20 rounded">
                              {coupon.code}
                            </span>
                            {expired && <span className="text-[9px] uppercase tracking-widest text-danger font-semibold flex items-center gap-1 mt-1.5"><AlertCircle size={12} /> Expired</span>}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-text-primary font-mono text-[13px]">
                              {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Flat`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-[13px] font-light text-text-secondary tracking-wider">
                              {coupon.minOrderAmount > 0 ? `Min subtotal: ₹${coupon.minOrderAmount}` : "No minimum"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-[13px] font-light text-text-secondary flex items-center gap-1.5 font-mono tracking-wider">
                              <Clock size={14} className="text-text-muted" />
                              {coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                title="Delete Coupon"
                                className="text-danger border-danger-light hover:bg-danger hover:text-white px-2"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-20 text-xs uppercase tracking-widest text-text-muted border-t border-dashed border-border-custom m-6 mt-0">
                No promo codes active in database.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
