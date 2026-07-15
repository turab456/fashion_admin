import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  MessageSquare,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Package
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import PageHeader from "../components/ui/PageHeader";
import KpiCard from "../components/ui/KpiCard";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/Table";

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    productsCount: 0,
    pendingReviews: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const ordersRes = await api.orders.list({ limit: 50 });
        const orders = ordersRes.data || [];
        const productsRes = await api.products.list({ limit: 50 });
        const products = productsRes.data || [];
        const reviewsRes = await api.reviews.listAdmin();
        const reviews = reviewsRes.data || [];

        const completedOrders = orders.filter(o => o.status !== "Cancelled");
        const totalRev = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingRev = reviews.filter(r => r.status === "Pending").length;

        setStats({
          revenue: Math.round(totalRev),
          ordersCount: orders.length,
          productsCount: products.length,
          pendingReviews: pendingRev
        });
        setRecentOrders(orders.slice(0, 8));

        // Group data for charts
        const revenueByDate = {};
        const statusCounts = {};

        orders.forEach(o => {
          // Status Chart
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

          // Revenue Chart (Group by day)
          if (o.status !== "Cancelled" && o.createdAt) {
            const dateStr = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (o.total || 0);
          }
        });

        const cData = Object.keys(revenueByDate).map(date => ({
          date,
          revenue: revenueByDate[date]
        }));
        
        // Ensure some dummy data if too few days
        if (cData.length === 0) {
          cData.push({ date: "Jan 1", revenue: 0 }, { date: "Jan 2", revenue: 0 });
        }
        setChartData(cData);

        const sData = Object.keys(statusCounts).map(status => ({
          name: status,
          value: statusCounts[status]
        }));
        setStatusData(sData);

      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered": return <Badge variant="success">Delivered</Badge>;
      case "Pending": return <Badge variant="warning">Pending</Badge>;
      case "Processing": return <Badge variant="info">Processing</Badge>;
      case "Cancelled": return <Badge variant="danger">Cancelled</Badge>;
      case "Shipped": return <Badge variant="info">Shipped</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-text-secondary text-sm">
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Orders",
      value: stats.ordersCount,
      icon: ShoppingBag,
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Products",
      value: stats.productsCount,
      icon: Package,
      iconBgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: MessageSquare,
      iconBgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of your store's performance"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <KpiCard
            key={card.label}
            title={card.label}
            value={card.value}
            icon={card.icon}
            iconBgColor={card.iconBgColor}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        
        {/* Revenue Chart */}
        <Card title="Revenue Overview">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={3} dot={{ r: 4, fill: "#111827", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown Chart */}
        <Card title="Orders by Status">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={-10} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => {
                    const colors = {
                      Pending: "#f59e0b",
                      Processing: "#3b82f6",
                      Shipped: "#0284c7",
                      Delivered: "#10b981",
                      Cancelled: "#ef4444"
                    };
                    return <Cell key={`cell-${index}`} fill={colors[entry.name] || "#111827"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Recent Orders Table */}
      <Card title="Recent Orders" action={<span className="text-xs text-text-muted">Latest {recentOrders.length} orders</span>} className="p-0 overflow-hidden">
        {recentOrders.length > 0 ? (
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-accent font-semibold">
                    #{order._id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>{order.shippingAddress?.name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.paymentGateway || "—"}</TableCell>
                  <TableCell className="font-semibold">₹{order.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-10 text-center text-text-muted text-sm">
            No orders found.
          </div>
        )}
      </Card>
    </div>
  );
}
