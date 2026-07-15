const BASE_URL = "http://localhost:5001/api/v1";

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

export async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errMsg;
    } catch (_) {}
    
    // Auto logout on token expiry / invalidation
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.dispatchEvent(new Event("admin-unauthorized"));
    }
    
    throw new Error(errMsg);
  }

  const payload = await res.json();
  return payload; // returns { success: true, message: "...", data: ... }
}

export const api = {
  auth: {
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request("/auth/logout", { method: "POST" }),
  },
  products: {
    list: (query = {}) => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          params.append(k, String(v));
        }
      });
      const qs = params.toString() ? `?${params.toString()}` : "";
      return request(`/products${qs}`);
    },
    getById: (id) => request(`/products/${id}`),
    create: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id) => request(`/products/${id}`, { method: "DELETE" }),
    
    createVariant: (productId, body) => request(`/products/${productId}/variants`, { method: "POST", body: JSON.stringify(body) }),
    updateVariant: (variantId, body) => request(`/products/variants/${variantId}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteVariant: (variantId) => request(`/products/variants/${variantId}`, { method: "DELETE" }),
    upload: (base64Image) => request("/products/upload", { method: "POST", body: JSON.stringify({ image: base64Image }) }),
  },
  orders: {
    list: (query = {}) => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          params.append(k, String(v));
        }
      });
      const qs = params.toString() ? `?${params.toString()}` : "";
      return request(`/orders/admin/all${qs}`);
    },
    getById: (id) => request(`/orders/${id}`),
    updateStatus: (id, status, description = "Status updated by admin", trackingArgs = {}) =>
      request(`/orders/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, description, ...trackingArgs })
      }),
  },
  reviews: {
    listAdmin: () => request("/reviews/admin"),
    moderate: (reviewId, status, comments = "Reviewed by admin") =>
      request(`/reviews/admin/${reviewId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, comments })
      }),
    reply: (reviewId, comment) =>
      request(`/reviews/admin/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ comment })
      }),
  },
  masters: {
    list: (masterType) => request(`/master/${masterType}`),
    create: (masterType, body) => request(`/master/${masterType}`, { method: "POST", body: JSON.stringify(body) }),
    delete: (masterType, id) => request(`/master/${masterType}/${id}`, { method: "DELETE" }),
  },
  coupons: {
    list: () => request("/coupons"),
    create: (body) => request("/coupons", { method: "POST", body: JSON.stringify(body) }),
    delete: (id) => request(`/coupons/${id}`, { method: "DELETE" }),
  },
  cms: {
    // Homepage Sections
    getHomepageSections: () => request("/cms/homepage/admin/all"),
    configureHomepageSection: (sectionKey, body) => request(`/cms/homepage/${sectionKey}`, { method: "PUT", body: JSON.stringify(body) }),
    // Banners
    getBanners: () => request("/cms/banners"),
    createBanner: (body) => request("/cms/banners", { method: "POST", body: JSON.stringify(body) }),
    updateBanner: (id, body) => request(`/cms/banners/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteBanner: (id) => request(`/cms/banners/${id}`, { method: "DELETE" }),
    // FAQs
    getFAQs: () => request("/cms/faqs"),
    createFAQ: (body) => request("/cms/faqs", { method: "POST", body: JSON.stringify(body) }),
    updateFAQ: (id, body) => request(`/cms/faqs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteFAQ: (id) => request(`/cms/faqs/${id}`, { method: "DELETE" }),
    // Pages
    getPages: () => request("/cms/pages"),
    createPage: (body) => request("/cms/pages", { method: "POST", body: JSON.stringify(body) }),
    updatePage: (id, body) => request(`/cms/pages/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deletePage: (id) => request(`/cms/pages/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: () => request("/customers/admin/all"),
    getById: (id) => request(`/customers/admin/${id}`),
    block: (id) => request(`/customers/admin/${id}/block`, { method: "PATCH" }),
    unblock: (id) => request(`/customers/admin/${id}/unblock`, { method: "PATCH" }),
  },
  marketing: {
    getCampaigns: (params = new URLSearchParams()) => {
      const qs = params.toString() ? `?${params.toString()}` : "";
      return request(`/marketing/campaigns${qs}`);
    },
    createCampaign: (body) => request(`/marketing/campaigns`, { method: "POST", body: JSON.stringify(body) }),
    updateCampaign: (id, body) => request(`/marketing/campaigns/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteCampaign: (id) => request(`/marketing/campaigns/${id}`, { method: "DELETE" }),
  },
  traffic: {
    getStats: () => request("/traffic/stats")
  }
};
