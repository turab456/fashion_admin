import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  X,
  Clock,
  TrendingUp,
  Truck,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");

  // Drawer / Modal details state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusDescription, setStatusDescription] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  useEffect(() => {
    loadOrders();
  }, [selectedStatusFilter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await api.orders.list({ status: selectedStatusFilter || undefined, limit: 100 });
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const desc = statusDescription || `Order status updated to: ${newStatus}`;
      const res = await api.orders.updateStatus(orderId, newStatus, desc, { trackingNumber, carrier });
      
      // Update selected order in state and local list
      setSelectedOrder(res.data);
      loadOrders();
      setStatusDescription("");
      alert(`Order status updated successfully to: ${newStatus}`);
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending": return <Badge variant="warning">Pending</Badge>;
      case "Processing": return <Badge variant="info">Processing</Badge>;
      case "Shipped": return <Badge variant="info">Shipped</Badge>;
      case "Delivered": return <Badge variant="success">Delivered</Badge>;
      default: return <Badge variant="danger">Cancelled</Badge>;
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setStatusDescription("");
    setTrackingNumber(order.trackingDetails?.trackingNumber || "");
    setCarrier(order.trackingDetails?.carrier || "");
    setIsDetailOpen(true);
  };

  const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Purchase Logs"
        subtitle="Order Fulfillment Operations"
        action={
          <div className="w-[260px] flex flex-col">
            <label className="text-[10px] text-text-muted uppercase font-semibold mb-1 tracking-wider">Filter By State</label>
            <select
              className="w-full bg-white border border-border-custom rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="">All Orders</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Orders List Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="text-center text-xs uppercase tracking-widest text-text-secondary py-20 select-none">
            Loading client transactions...
          </div>
        ) : orders.length > 0 ? (
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableHead>Order Code</TableHead>
              <TableHead>Customer / Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Total Charged</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell>
                    <span className="font-mono text-accent text-xs font-semibold">
                      #{o._id.substring(o._id.length - 8).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-text-primary uppercase tracking-wide text-[13px]">
                      {o.shippingAddress?.name || "Anonymous Buyer"}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase font-mono">
                      {o.createdAt ? o.createdAt.split("T")[0] : "Date Unavailable"}
                    </p>
                  </TableCell>
                  <TableCell>{getStatusBadge(o.status)}</TableCell>
                  <TableCell className="uppercase font-mono text-xs">{o.paymentGateway}</TableCell>
                  <TableCell className="font-mono font-medium text-[13px]">₹{o.total} INR</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openOrderDetails(o)}
                        className="text-xs uppercase tracking-wider"
                      >
                        <Eye size={14} className="mr-1.5" />
                        Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-20 text-xs uppercase tracking-widest text-text-muted">
            No order transactions match this criteria.
          </div>
        )}
      </Card>

      {/* ORDER INVOICE DETAILS DRAWER */}
      <Modal
        isOpen={isDetailOpen && !!selectedOrder}
        onClose={() => setIsDetailOpen(false)}
        title={selectedOrder ? `Invoice & Settlement — #${selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}` : "Invoice & Settlement"}
        maxWidth="max-w-4xl"
      >
        {selectedOrder && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Items details (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <h4 className="text-xs uppercase tracking-widest font-semibold text-text-primary border-b border-border-custom pb-2">
                Garment Purchases
              </h4>

              <div className="divide-y divide-border-custom border border-border-custom rounded bg-gray-50">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-12 bg-cover bg-center border border-border-custom rounded-sm bg-white"
                        style={{ backgroundImage: `url(${item.product?.images?.[0] || "/images/products/placeholder.jpg"})` }}
                      />
                      <div>
                        <p className="font-semibold uppercase text-text-primary text-[13px]">{item.product?.name || "Garment Product"}</p>
                        <p className="text-[10px] text-text-muted uppercase mt-0.5 tracking-wider">
                          Size: {item.size?.name || item.size} / Color: {item.color?.name || item.color}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-medium text-[13px]">₹{item.price} INR</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal block */}
              <div className="bg-gray-50 p-4 space-y-2 border border-border-custom rounded font-mono text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Tax Allocation (8%)</span>
                  <span>₹{Math.round(selectedOrder.total * 0.08)} INR</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Courier Fee</span>
                  <span>₹0.00 INR</span>
                </div>
                <div className="flex justify-between border-t border-border-custom pt-3 mt-3 text-text-primary font-bold text-[13px]">
                  <span>TOTAL SETTLED</span>
                  <span className="text-accent">₹{selectedOrder.total} INR</span>
                </div>
              </div>
            </div>

            {/* Right Column: Address and Fulfillment controls (5 cols) */}
            <div className="md:col-span-5 space-y-6 md:border-l border-border-custom md:pl-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold text-text-primary border-b border-border-custom pb-2 mb-3">
                  Shipping Details
                </h4>
                <div className="text-[13px] text-text-secondary space-y-1.5 tracking-wider leading-relaxed">
                  <p className="font-bold text-text-primary uppercase">{selectedOrder.shippingAddress?.name}</p>
                  <p>{selectedOrder.shippingAddress?.street}</p>
                  <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zip}</p>
                  <p>{selectedOrder.shippingAddress?.country}</p>
                </div>
                
                {selectedOrder.trackingDetails?.trackingNumber && (
                  <div className="mt-4 p-3 bg-gray-50 border border-border-custom rounded text-[13px]">
                    <p className="uppercase tracking-widest font-semibold text-text-primary mb-1 text-xs">Carrier Tracking</p>
                    <p className="text-text-secondary"><span className="font-medium text-text-primary">Carrier:</span> {selectedOrder.trackingDetails.carrier || "N/A"}</p>
                    <p className="text-text-secondary"><span className="font-medium text-text-primary">Tracking #:</span> {selectedOrder.trackingDetails.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Status adjustment */}
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold text-text-primary border-b border-border-custom pb-2 mb-3">
                  Status Settings
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Current State:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  <div className="space-y-3">
                    <Input
                      label="Update Action Log Description"
                      placeholder="E.g., Shipped via DHL tracking #1927"
                      value={statusDescription}
                      onChange={(e) => setStatusDescription(e.target.value)}
                    />
                    
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <Input
                        label="Carrier (Optional)"
                        placeholder="DHL, FedEx..."
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                      />
                      <Input
                        label="Tracking # (Optional)"
                        placeholder="AWB..."
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 select-none mt-4">
                      {statusOptions.map((st) => (
                        <button
                          key={st}
                          disabled={updatingStatus || selectedOrder.status === st}
                          onClick={() => handleUpdateStatus(selectedOrder._id, st)}
                          className={`py-2 text-[10px] font-semibold uppercase tracking-widest border transition-all duration-300 rounded ${
                            selectedOrder.status === st
                              ? "bg-accent/10 border-accent text-accent opacity-50 cursor-not-allowed"
                              : "border-border-custom text-text-secondary hover:border-text-primary hover:text-text-primary bg-white"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
