"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  FieldValue,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Plus,
  List,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://aivideogenerator-production.up.railway.app";

interface MarketplaceProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerDisplayName?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  price: number;
  tags: string[];
  hasAudio: boolean;
  useCases: string[];
  status: string;
  featured?: boolean;
  createdAt: Timestamp | FieldValue | string;
  updatedAt?: Timestamp | FieldValue | string;
  salesCount?: number;
  adminNotes?: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
}

function MarketplaceContent() {
  const { addToast } = useToast();
  const { user, getIdToken } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  // List state
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    status: "",
    featured: false,
    adminNotes: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Add form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const [formData, setFormData] = useState({
    videoUrl: "",
    thumbnailUrl: "",
    email: "",
    title: "",
    description: "",
    price: "",
    tags: "",
    hasAudio: true,
    useCases: "",
    prompt: "",
    sellerId: "admin_" + Date.now(),
  });

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await getIdToken();
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("limit", "100");

      const response = await fetch(
        `${API_BASE_URL}/admin/marketplace/products?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      addToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      fetchProducts();
    }
  }, [activeTab, statusFilter, user]);

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.sellerName?.toLowerCase().includes(query) ||
      product.sellerEmail?.toLowerCase().includes(query) ||
      product.id?.toLowerCase().includes(query)
    );
  });

  // Open edit modal
  const openEditModal = (product: MarketplaceProduct) => {
    setEditingProduct(product);
    setEditFormData({
      title: product.title || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      status: product.status || "active",
      featured: product.featured || false,
      adminNotes: product.adminNotes || "",
    });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingProduct(null);
    setEditFormData({
      title: "",
      description: "",
      price: "",
      status: "",
      featured: false,
      adminNotes: "",
    });
  };

  // Update product
  const handleUpdateProduct = async () => {
    if (!editingProduct || !user) return;

    setIsUpdating(true);
    try {
      const token = await getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/marketplace/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editFormData.title || undefined,
            description: editFormData.description || undefined,
            price: editFormData.price ? parseFloat(editFormData.price) : undefined,
            status: editFormData.status || undefined,
            featured: editFormData.featured,
            adminNotes: editFormData.adminNotes || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update product");
      }

      addToast("Product updated successfully", "success");
      closeEditModal();
      fetchProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update product";
      addToast(errorMessage, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string, permanent: boolean = false) => {
    if (!user) return;

    const confirmMessage = permanent
      ? "Are you sure you want to PERMANENTLY delete this product? This cannot be undone."
      : "Are you sure you want to delete this product? It can be restored later.";

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = await getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/marketplace/products/${productId}?permanent=${permanent}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete product");
      }

      addToast(permanent ? "Product permanently deleted" : "Product marked as deleted", "success");
      fetchProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      addToast(errorMessage, "error");
    }
  };

  // Restore product
  const handleRestoreProduct = async (productId: string) => {
    if (!user) return;

    try {
      const token = await getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/marketplace/products/${productId}/restore`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to restore product");
      }

      addToast("Product restored successfully", "success");
      fetchProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to restore product";
      addToast(errorMessage, "error");
    }
  };

  // Add form handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({
      ...prev,
      videoUrl: url,
    }));
    if (url) {
      setVideoPreview(url);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setUserEmail(email);
    setFormData((prev) => ({
      ...prev,
      email: email,
    }));
    setSelectedUser(null);
  };

  const lookupUserByEmail = async () => {
    if (!userEmail.trim()) {
      addToast("Please enter an email address", "error");
      return;
    }

    setIsLoadingUser(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", userEmail.toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        addToast("No user attached to the mail", "error");
        setSelectedUser(null);
        setFormData((prev) => ({
          ...prev,
          sellerId: "admin_" + Date.now(),
        }));
        return;
      }

      const userData = snapshot.docs[0];
      const foundUser: UserData = {
        id: userData.id,
        email: userData.data().email || userEmail,
        displayName: userData.data().displayName || userData.data().name,
        name: userData.data().name,
      };

      setSelectedUser(foundUser);
      setFormData((prev) => ({
        ...prev,
        sellerId: foundUser.id,
      }));
      addToast(`User found: ${foundUser.displayName || foundUser.email}`, "success");
    } catch (err) {
      addToast("Error looking up user", "error");
      console.error(err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      if (!formData.videoUrl.trim()) {
        throw new Error("Video URL is required");
      }
      if (!selectedUser) {
        throw new Error("User email is required and must be validated");
      }
      if (!formData.title.trim()) {
        throw new Error("Product title is required");
      }
      if (!formData.price) {
        throw new Error("Price is required");
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Price must be a valid positive number");
      }

      if (!formData.tags.trim()) {
        throw new Error("At least one tag is required");
      }

      const sellerName = selectedUser.displayName || selectedUser.name || selectedUser.email;

      const productData = {
        sellerId: formData.sellerId,
        sellerName: sellerName,
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl || formData.videoUrl,
        price: price,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        hasAudio: formData.hasAudio,
        useCases: formData.useCases
          .split(",")
          .map((uc) => uc.trim())
          .filter(Boolean),
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        salesCount: 0,
        prompt: formData.prompt || undefined,
      };

      await addDoc(collection(db, "marketplace_listings"), productData);

      setFormData({
        videoUrl: "",
        thumbnailUrl: "",
        email: "",
        title: "",
        description: "",
        price: "",
        tags: "",
        hasAudio: true,
        useCases: "",
        prompt: "",
        sellerId: "admin_" + Date.now(),
      });
      setUserEmail("");
      setSelectedUser(null);
      setVideoPreview(null);
      setSuccess(true);
      addToast("Product successfully added to marketplace!", "success");

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create listing";
      setError(errorMessage);
      addToast(errorMessage, "error");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/20 text-green-400 border-green-500/50",
      inactive: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      suspended: "bg-red-500/20 text-red-400 border-red-500/50",
      deleted: "bg-neutral-500/20 text-neutral-400 border-neutral-500/50",
      published: "bg-green-500/20 text-green-400 border-green-500/50",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[status] || styles.inactive}`}>
        {status}
      </span>
    );
  };

  const inputStyles = "bg-neutral-900/50 border-neutral-800 text-white placeholder-neutral-600";
  const labelStyles = "text-sm font-medium text-neutral-300 mb-2 block";

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto py-16 px-4">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Marketplace Management
            </h1>
            <p className="text-neutral-500 text-sm mt-2">
              Manage marketplace products, listings, and content
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setActiveTab("list")}
            className={`${
              activeTab === "list"
                ? "bg-white text-black"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            View Products
          </Button>
          <Button
            onClick={() => setActiveTab("add")}
            className={`${
              activeTab === "add"
                ? "bg-white text-black"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* List Tab */}
        {activeTab === "list" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  placeholder="Search by title, seller, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${inputStyles} pl-10`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-white rounded-md px-4 py-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
              <Button
                onClick={fetchProducts}
                className="bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Products List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 bg-neutral-800" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="bg-neutral-900/50 border-neutral-800 p-12 text-center">
                <p className="text-neutral-400">No products found</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-neutral-900/50 border-neutral-800 p-4 hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                        {product.thumbnailUrl ? (
                          <video
                            src={product.thumbnailUrl}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600">
                            <Eye className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {product.title}
                          </h3>
                          {getStatusBadge(product.status)}
                          {product.featured && (
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400">
                          Seller: {product.sellerDisplayName || product.sellerName || "Unknown"}{" "}
                          ({product.sellerEmail || product.sellerId})
                        </p>
                        <p className="text-sm text-neutral-500">
                          €{product.price?.toFixed(2)} • {product.salesCount || 0} sales
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openEditModal(product)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {product.status === "deleted" ? (
                          <Button
                            onClick={() => handleRestoreProduct(product.id)}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-2"
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-2"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <p className="text-sm text-neutral-500 text-center">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}

        {/* Add Tab */}
        {activeTab === "add" && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Video Preview */}
            <div>
              <div className="sticky top-20">
                <h3 className="text-sm uppercase tracking-widest text-neutral-400 mb-4">
                  Preview
                </h3>
                {videoPreview ? (
                  <Card className="overflow-hidden rounded-2xl">
                    <div className="aspect-video bg-neutral-800">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Card>
                ) : (
                  <Card className="overflow-hidden rounded-2xl">
                    <div className="aspect-video bg-neutral-800 flex items-center justify-center text-neutral-500">
                      <p>Enter video URL to preview</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                    Product successfully added to marketplace!
                  </div>
                )}

                {/* Video URL */}
                <div>
                  <label className={labelStyles}>Video URL *</label>
                  <Input
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleVideoUrlChange}
                    placeholder="https://example.com/video.mp4"
                    className={inputStyles}
                    required
                  />
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className={labelStyles}>Thumbnail URL</label>
                  <Input
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/thumbnail.jpg"
                    className={inputStyles}
                  />
                </div>

                {/* Email Lookup */}
                <div>
                  <label className={labelStyles}>Seller Email *</label>
                  <div className="flex gap-2">
                    <Input
                      name="email"
                      type="email"
                      value={userEmail}
                      onChange={handleEmailChange}
                      placeholder="seller@example.com"
                      className={inputStyles}
                      required
                    />
                    <Button
                      type="button"
                      onClick={lookupUserByEmail}
                      disabled={isLoadingUser || !userEmail.trim()}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white font-medium px-6 whitespace-nowrap"
                    >
                      {isLoadingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Lookup"
                      )}
                    </Button>
                  </div>
                  {selectedUser && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-900/20 border border-green-700 rounded text-green-200 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>{selectedUser.displayName || selectedUser.name || selectedUser.email}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-neutral-800" />

                {/* Title */}
                <div>
                  <label className={labelStyles}>Product Title *</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Futuristic City Intro Video"
                    className={inputStyles}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelStyles}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the video..."
                    rows={4}
                    className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2`}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className={labelStyles}>Price (EUR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="99.99"
                      className={`${inputStyles} pl-8`}
                      required
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className={labelStyles}>Tags * (comma separated)</label>
                  <Input
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., futuristic, cinematic, intro"
                    className={inputStyles}
                    required
                  />
                </div>

                {/* Audio */}
                <div className="flex items-center gap-3 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                  <input
                    type="checkbox"
                    name="hasAudio"
                    id="hasAudio"
                    checked={formData.hasAudio}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700"
                  />
                  <label htmlFor="hasAudio" className="text-sm font-medium cursor-pointer">
                    Video includes audio
                  </label>
                </div>

                {/* Use Cases */}
                <div>
                  <label className={labelStyles}>Use Cases (comma separated)</label>
                  <textarea
                    name="useCases"
                    value={formData.useCases}
                    onChange={handleInputChange}
                    placeholder="e.g., YouTube intro, TikTok transition"
                    rows={3}
                    className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2`}
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-neutral-200 hover:bg-white text-black font-medium py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish to Marketplace"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingProduct && (
          <>
            <div
              className="fixed inset-0 bg-black/70 z-40"
              onClick={closeEditModal}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4">
              <Card className="bg-neutral-900 border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Edit Product</h2>
                  <button onClick={closeEditModal} className="text-neutral-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelStyles}>Title</label>
                    <Input
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className={labelStyles}>Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                      className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2`}
                    />
                  </div>

                  <div>
                    <label className={labelStyles}>Price (EUR)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editFormData.price}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, price: e.target.value }))
                      }
                      className={inputStyles}
                    />
                  </div>

                  <div>
                    <label className={labelStyles}>Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-md px-4 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={editFormData.featured}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, featured: e.target.checked }))
                      }
                      className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700"
                    />
                    <label htmlFor="featured" className="text-sm text-neutral-300">
                      Featured Product
                    </label>
                  </div>

                  <div>
                    <label className={labelStyles}>Admin Notes</label>
                    <textarea
                      value={editFormData.adminNotes}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, adminNotes: e.target.value }))
                      }
                      rows={2}
                      placeholder="Internal notes about this product..."
                      className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2`}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={closeEditModal}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateProduct}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <AdminAuthWrapper>
      <MarketplaceContent />
    </AdminAuthWrapper>
  );
}
