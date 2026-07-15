import React from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  MessageSquare,
  Settings,
  LogOut,
  Tag,
  Package,
  Users,
  LayoutTemplate,
  Megaphone,
  Globe
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, adminUser, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ClipboardList },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "cms", label: "CMS", icon: LayoutTemplate },
    { id: "traffic", label: "Traffic", icon: Globe },
    { id: "masters", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div>
        <div className="sidebar-logo-container">
          <div className="flex items-center gap-2">
            <div className="sidebar-logo-icon">
              <Package size={16} color="#fff" />
            </div>
            <div>
              <div className="sidebar-logo-title">AURA</div>
              <div className="sidebar-logo-subtitle">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-btn ${isActive ? "active" : ""}`}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {adminUser?.name || "Super Admin"}
          </div>
          <div className="sidebar-user-email">
            {adminUser?.email || "admin@aurafashion.com"}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="sidebar-logout-btn"
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
