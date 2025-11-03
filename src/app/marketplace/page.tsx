"use client";

import { useState, FormEvent } from "react";
// FIX: Import Timestamp and FieldValue types from firestore
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  FieldValue,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminAuthWrapper } from "@/components/AdminAuthWrapper";

// FIX: Replace 'any' with the specific Firestore types
interface MarketplaceProduct {
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  price: number;
  tags: string[];
  hasAudio: boolean;
  useCases: string[];
  status: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  sold: number;
  prompt?: string;
  generationId?: string;
}

function MarketplaceContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    videoUrl: "",
    thumbnailUrl: "",
    sellerName: "",
    title: "",
    description: "",
    price: "",
    tags: "",
    hasAudio: true,
    useCases: "",
    prompt: "",
    sellerId: "admin_" + Date.now(),
  });

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.videoUrl.trim()) {
        throw new Error("Video URL is required");
      }
      if (!formData.sellerName.trim()) {
        throw new Error("Seller name is required");
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

      // Create product data
      const productData: MarketplaceProduct = {
        sellerId: formData.sellerId,
        sellerName: formData.sellerName,
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
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sold: 0,
        prompt: formData.prompt || undefined,
        generationId: undefined,
      };

      // Save to Firestore
      await addDoc(collection(db, "marketplace_listings"), productData);

      // Reset form
      setFormData({
        videoUrl: "",
        thumbnailUrl: "",
        sellerName: "",
        title: "",
        description: "",
        price: "",
        tags: "",
        hasAudio: true,
        useCases: "",
        prompt: "",
        sellerId: "admin_" + Date.now(),
      });
      setVideoPreview(null);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles =
    "bg-neutral-900/50 border-neutral-800 text-white placeholder-neutral-600";
  const labelStyles = "text-sm font-medium text-neutral-300 mb-2 block";

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto py-16 px-4">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter mb-4 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Add to Marketplace
        </h1>
        <p className="text-neutral-400 mb-16">
          Manually upload a video product to the marketplace
        </p>

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
                  ✓ Product successfully added to marketplace!
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
                <p className="text-xs text-neutral-500 mt-1">
                  Full URL to video file (MP4, WebM, etc.)
                </p>
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
                <p className="text-xs text-neutral-500 mt-1">
                  If empty, will use video URL
                </p>
              </div>

              {/* Seller Name */}
              <div>
                <label className={labelStyles}>Seller Name *</label>
                <Input
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  placeholder="Creator or Brand Name"
                  className={inputStyles}
                  required
                />
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
                  placeholder="Describe the video, mood, style, and potential uses..."
                  rows={4}
                  className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-700 resize-none`}
                />
              </div>

              {/* Price */}
              <div>
                <label className={labelStyles}>Price (EUR) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                    €
                  </span>
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
                  placeholder="e.g., futuristic, cinematic, intro, tech"
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
                  className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700 cursor-pointer"
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
                  placeholder="e.g., YouTube intro, TikTok transition, web background"
                  rows={3}
                  className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-700 resize-none`}
                />
              </div>

              {/* Prompt (Optional) */}
              <div>
                <label className={labelStyles}>Original Prompt (Optional)</label>
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  placeholder="Original generation prompt..."
                  rows={2}
                  className={`w-full ${inputStyles} border border-neutral-800 rounded-lg px-4 py-2 focus:outline-none focus:border-neutral-700 resize-none`}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-400 hover:bg-yellow-400/90 text-black font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
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

              <p className="text-xs text-neutral-500 text-center">
                This product will be immediately visible on the marketplace
              </p>
            </form>
          </div>
        </div>
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