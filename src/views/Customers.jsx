import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Search, UserX, UserCheck, Eye, Mail, Phone, MapPin, ShoppingBag, Calendar, Clock, Tag } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerOrders(selectedCustomer._id);
    } else {
      setCustomerOrders([]);
    }
  }, [selectedCustomer]);

  const loadCustomerOrders = async (customerId) => {
    try {
      setLoadingOrders(true);
      const res = await api.orders.list({ user: customerId, limit: 100 });
      setCustomerOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getPreferredCategories = () => {
    const cats = new Set();
    customerOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.product?.category?.name) {
          cats.add(item.product.category.name);
        }
      });
    });
    return Array.from(cats);
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.customers.list();
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id, currentlyBlocked) => {
    const action = currentlyBlocked ? "Unblock" : "Block";
    if (!window.confirm(`${action} this customer?`)) return;
    try {
      if (currentlyBlocked) {
        await api.customers.unblock(id);
      } else {
        await api.customers.block(id);
      }
      loadCustomers();
      if (selectedCustomer?._id === id) {
        setSelectedCustomer(prev => ({...prev, isBlocked: !currentlyBlocked}));
      }
    } catch (err) {
      alert(err.message || "Action failed.");
    }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        action={
          <div className="w-[260px]">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              icon={Search}
            />
          </div>
        }
      />

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-14 text-center text-text-muted text-sm">Loading customers...</div>
        ) : (
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Addresses</TableHead>
              <TableHead>Wishlist</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-10 text-center text-text-muted text-sm">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : filtered.map(c => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full bg-blue-50 flex items-center justify-center text-sm font-semibold text-blue-600 shrink-0">
                        {c.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium text-sm text-text-primary">{c.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{c.email}</TableCell>
                  <TableCell className="text-[13px]">{c.phone || "—"}</TableCell>
                  <TableCell className="text-[13px]">{c.addresses?.length || 0}</TableCell>
                  <TableCell className="text-[13px]">{c.wishlist?.length || 0}</TableCell>
                  <TableCell className="text-xs text-text-muted">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {c.isBlocked ? (
                      <Badge variant="danger">Blocked</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(c)}
                        title="View Details"
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                      <Button
                        variant={c.isBlocked ? "outline" : "outline"}
                        size="sm"
                        onClick={() => handleBlock(c._id, c.isBlocked)}
                        title={c.isBlocked ? "Unblock" : "Block"}
                        className={c.isBlocked ? "text-success border-success-light hover:bg-success hover:text-white" : "text-danger border-danger-light hover:bg-danger hover:text-white"}
                      >
                        {c.isBlocked ? <UserCheck size={14} className="mr-1" /> : <UserX size={14} className="mr-1" />}
                        {c.isBlocked ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSelectedCustomer(null)}
            >
              Close
            </Button>
            <Button
              variant={selectedCustomer?.isBlocked ? "success" : "danger"}
              onClick={() => handleBlock(selectedCustomer._id, selectedCustomer.isBlocked)}
            >
              {selectedCustomer?.isBlocked ? <><UserCheck size={14} className="mr-1.5" /> Unblock Customer</> : <><UserX size={14} className="mr-1.5" /> Block Customer</>}
            </Button>
          </>
        }
      >
        {selectedCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Panel: Profile, Contact, Location (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-full bg-blue-50 flex items-center justify-center text-xl font-bold text-blue-600 shrink-0">
                  {selectedCustomer.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-base text-text-primary">{selectedCustomer.name}</p>
                  <div className="mt-1">
                    {selectedCustomer.isBlocked ? (
                      <Badge variant="danger">Blocked</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Contact Details</p>
                <div className="bg-gray-50 border border-border-custom rounded-md p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                    <Mail size={14} className="text-text-muted shrink-0" />
                    <span className="truncate" title={selectedCustomer.email}>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                    <Phone size={14} className="text-text-muted shrink-0" />
                    <span>{selectedCustomer.phone || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Location Details (Addresses) */}
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Saved Locations</p>
                {selectedCustomer.addresses?.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedCustomer.addresses.map((addr, i) => (
                      <div key={i} className="bg-gray-50 border border-border-custom rounded-md px-3 py-2.5 text-[13px] text-text-secondary relative">
                        {addr.isDefault && (
                          <span className="text-[9px] font-bold text-accent mb-1 block uppercase tracking-wider">Default Address</span>
                        )}
                        <p className="font-medium text-text-primary">{addr.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">{addr.street}, {addr.city}, {addr.country} {addr.zip}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-border-custom rounded-md p-4 text-center text-xs text-text-muted uppercase tracking-widest">
                    No locations provided
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Preferred Categories & Order History (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              {/* Preferred Categories */}
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Preferred Clothing Categories</p>
                <div className="flex flex-wrap gap-1.5 p-3.5 bg-gray-50 border border-border-custom rounded-md min-h-[50px] items-center">
                  {loadingOrders ? (
                    <span className="text-xs text-text-muted">Analyzing preferences...</span>
                  ) : getPreferredCategories().length > 0 ? (
                    getPreferredCategories().map((cat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-light/10 text-accent border border-accent/20">
                        <Tag size={10} />
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted">No category data available</span>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Client Order History</p>
                <div className="bg-white border border-border-custom rounded-md overflow-hidden">
                  {loadingOrders ? (
                    <div className="text-center py-8 text-xs text-text-muted uppercase tracking-widest">
                      Retrieving customer history...
                    </div>
                  ) : customerOrders.length > 0 ? (
                    <div className="max-h-[220px] overflow-y-auto">
                      <Table className="border-0 rounded-none text-xs">
                        <TableHeader className="bg-gray-50/50">
                          <TableHead className="py-2 text-[10px] uppercase font-semibold">Order ID</TableHead>
                          <TableHead className="py-2 text-[10px] uppercase font-semibold">Date</TableHead>
                          <TableHead className="py-2 text-[10px] uppercase font-semibold">Total</TableHead>
                          <TableHead className="py-2 text-[10px] uppercase font-semibold text-right">Status</TableHead>
                        </TableHeader>
                        <TableBody>
                          {customerOrders.map(o => (
                            <TableRow key={o._id} className="hover:bg-gray-50/40">
                              <TableCell className="py-2 font-mono font-semibold text-accent">
                                #{o._id.substring(o._id.length - 8).toUpperCase()}
                              </TableCell>
                              <TableCell className="py-2 text-text-secondary">
                                {o.createdAt ? o.createdAt.split("T")[0] : "N/A"}
                              </TableCell>
                              <TableCell className="py-2 font-mono font-medium text-text-primary">
                                ₹{o.total}
                              </TableCell>
                              <TableCell className="py-2 text-right">
                                {o.status === "Pending" && <Badge variant="warning">Pending</Badge>}
                                {o.status === "Processing" && <Badge variant="info">Processing</Badge>}
                                {o.status === "Shipped" && <Badge variant="info">Shipped</Badge>}
                                {o.status === "Delivered" && <Badge variant="success">Delivered</Badge>}
                                {o.status === "Cancelled" && <Badge variant="danger">Cancelled</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs text-text-muted uppercase tracking-widest border-t border-dashed border-border-custom m-4 mt-0 pt-6">
                      No order transactions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
