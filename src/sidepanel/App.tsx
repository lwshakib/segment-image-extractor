import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Copy, Download, ExternalLink, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import "./App.css";

interface ImageItem {
  id: number;
  url: string;
  width: number;
  height: number;
  alt: string;
  mimetype?: string;
  size?: number; // file size in bytes
}

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<
    "size" | "width" | "height" | "mimetype" | "dimensions"
  >("size");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  const fetchImagesFromTab = async () => {
    setLoading(true);
    console.log("Starting image extraction...");
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      console.log("Active tab:", tab);

      if (!tab.id) {
        console.error("No active tab found");
        setLoading(false);
        return;
      }

      // Try to send message to content script first
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "extractImages",
        });
        console.log("Content script response:", response);

        if (response && response.images) {
          const extractedImages: ImageItem[] = response.images.map(
            (img: any, index: number) => ({
              id: index,
              url: img.url,
              width: img.width,
              height: img.height,
              alt: img.alt,
              mimetype: img.mimetype,
              size: img.size,
            })
          );

          console.log("Images from content script:", extractedImages);
          setImages(extractedImages);

          if (extractedImages.length > 0) {
            fetchImageMetadata(extractedImages);
          }
          return;
        }
      } catch (error) {
        console.log(
          "Content script message failed, trying direct injection:",
          error
        );
      }

      // Fallback: Inject script to extract images directly
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const images = document.querySelectorAll("img");
          const imageData: Array<{
            url: string;
            width: number;
            height: number;
            alt: string;
            mimetype?: string;
            size?: number;
          }> = [];

          images.forEach((img, index) => {
            const src =
              img.src ||
              img.getAttribute("data-src") ||
              img.getAttribute("data-lazy-src");

            if (src && src.startsWith("http")) {
              imageData.push({
                url: src,
                width: img.naturalWidth || img.width || 0,
                height: img.naturalHeight || img.height || 0,
                alt: img.alt || `Image ${index + 1}`,
                mimetype: undefined,
                size: undefined,
              });
            }
          });

          console.log("Extracted images:", imageData);
          return imageData;
        },
      });

      if (results && results[0] && results[0].result) {
        const extractedImages: ImageItem[] = results[0].result.map(
          (img: any, index: number) => ({
            id: index,
            url: img.url,
            width: img.width,
            height: img.height,
            alt: img.alt,
            mimetype: img.mimetype,
            size: img.size,
          })
        );

        console.log("Basic extracted images:", extractedImages);

        // Set images immediately so they show up
        setImages(extractedImages);

        // Try to fetch metadata for each image (this will be async and update the state)
        if (extractedImages.length > 0) {
          fetchImageMetadata(extractedImages);
        }

        console.log(
          "All extracted image URLs:",
          extractedImages.map((img) => img.url)
        );
      } else {
        console.log("No images found");
        setImages([]);
      }
    } catch (error) {
      console.error("Error fetching images from tab:", error);
      // Fallback: show some test images if extraction fails
      console.log("Using fallback test images");
      const fallbackImages: ImageItem[] = [
        {
          id: 1,
          url: "https://picsum.photos/300/200?random=1",
          width: 300,
          height: 200,
          alt: "Test Image 1",
        },
        {
          id: 2,
          url: "https://picsum.photos/400/300?random=2",
          width: 400,
          height: 300,
          alt: "Test Image 2",
        },
      ];
      setImages(fallbackImages);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch metadata for images
  const fetchImageMetadata = async (images: ImageItem[]) => {
    const updatedImages = [...images];

    for (let i = 0; i < updatedImages.length; i++) {
      const image = updatedImages[i];
      try {
        const response = await fetch(image.url, { method: "HEAD" });
        if (response.ok) {
          const contentLength = response.headers.get("content-length");
          const contentType = response.headers.get("content-type");

          if (contentLength) {
            updatedImages[i].size = parseInt(contentLength, 10);
          }
          if (contentType) {
            updatedImages[i].mimetype = contentType;
          }
        }
      } catch (error) {
        console.log(`Could not fetch metadata for ${image.url}:`, error);
      }
    }

    setImages(updatedImages);
  };

  // Filter images based on selected criteria
  const filteredImages = images.filter((img) => {
    const matchesSize =
      selectedSize === "all" ||
      (img.width &&
        img.height &&
        `${img.width}x${img.height}` === selectedSize);

    const matchesFormat =
      selectedFormat === "all" ||
      (img.mimetype &&
        img.mimetype.split("/")[1]?.toUpperCase() === selectedFormat);

    return matchesSize && matchesFormat;
  });

  // Sort images based on current sort criteria
  const sortedImages = [...filteredImages].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "size":
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      case "width":
        aValue = a.width || 0;
        bValue = b.width || 0;
        break;
      case "height":
        aValue = a.height || 0;
        bValue = b.height || 0;
        break;
      case "dimensions":
        aValue = (a.width || 0) * (a.height || 0);
        bValue = (b.width || 0) * (b.height || 0);
        break;
      case "mimetype":
        aValue = a.mimetype || "";
        bValue = b.mimetype || "";
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Format file size for display
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Generate unique dimensions from images
  const getUniqueDimensions = (): string[] => {
    const dimensions = new Set<string>();
    images.forEach((img) => {
      if (img.width && img.height) {
        dimensions.add(`${img.width}x${img.height}`);
      }
    });
    return Array.from(dimensions).sort((a, b) => {
      const [aWidth, aHeight] = a.split("x").map(Number);
      const [bWidth, bHeight] = b.split("x").map(Number);
      return bWidth * bHeight - aWidth * aHeight; // Sort by area, largest first
    });
  };

  // Generate unique formats from images
  const getUniqueFormats = (): string[] => {
    const formats = new Set<string>();
    images.forEach((img) => {
      if (img.mimetype) {
        const format = img.mimetype.split("/")[1]?.toUpperCase() || "UNKNOWN";
        formats.add(format);
      }
    });
    return Array.from(formats).sort();
  };

  // Handle image download
  const handleDownload = async (imageUrl: string, alt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Handle copying image URL to clipboard
  const handleCopyLink = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Image URL copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy image URL");
    }
  };

  // Handle opening image in new tab
  const handleExternalLink = (imageUrl: string) => {
    window.open(imageUrl, "_blank");
  };

  // Handle image selection
  const handleImageSelect = (imageId: number, checked: boolean) => {
    const newSelected = new Set(selectedImages);
    if (checked) {
      newSelected.add(imageId);
    } else {
      newSelected.delete(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Handle select all images
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedImages(new Set(sortedImages.map((img) => img.id)));
    } else {
      setSelectedImages(new Set());
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    const selectedImageData = sortedImages.filter((img) =>
      selectedImages.has(img.id)
    );

    for (const image of selectedImageData) {
      try {
        await handleDownload(image.url, image.alt);
        // Add a small delay between downloads to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to download ${image.alt}:`, error);
      }
    }
  };

  // Handle CSV export
  const handleCSVExport = () => {
    const selectedImageData = sortedImages.filter((img) =>
      selectedImages.has(img.id)
    );

    const csvContent = [
      ["URL", "Alt Text", "Width", "Height", "Size", "MIME Type"],
      ...selectedImageData.map((img) => [
        img.url,
        `"${img.alt.replace(/"/g, '""')}"`, // Escape quotes in CSV
        img.width,
        img.height,
        img.size ? formatFileSize(img.size) : "Unknown",
        img.mimetype || "Unknown",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected_images.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle JSON export
  const handleJSONExport = () => {
    const selectedImageData = sortedImages.filter((img) =>
      selectedImages.has(img.id)
    );

    const jsonContent = JSON.stringify(selectedImageData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected_images.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchImagesFromTab();
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="p-4 bg-background min-h-screen">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-card rounded-lg">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-[140px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-9 w-[140px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>

      {/* Status text skeleton */}
      <Skeleton className="h-4 w-48 mb-4" />

      {/* Select all skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Image grid skeleton */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="break-inside-avoid mb-4 overflow-hidden rounded-lg shadow-lg"
          >
            {/* Image skeleton */}
            <Skeleton className="w-full h-48" />

            {/* Card content skeleton */}
            <div className="p-3 bg-card">
              <Skeleton className="h-4 w-full mb-2" />
              <div className="space-y-1 mt-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex justify-end gap-1 mt-3">
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchImagesFromTab}
            disabled={loading}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <ModeToggle />
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-card rounded-lg">
          {/* Sort by */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              Sort by:
            </label>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="size">File Size</SelectItem>
                <SelectItem value="width">Width</SelectItem>
                <SelectItem value="height">Height</SelectItem>
                <SelectItem value="dimensions">Dimensions</SelectItem>
                <SelectItem value="mimetype">MIME Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              Order:
            </label>
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as any)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Size */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Size:</label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sizes</SelectItem>
                {getUniqueDimensions().map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Format */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              Format:
            </label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="All formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                {getUniqueFormats().map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions */}
      {selectedImages.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="flex items-center gap-3 p-4 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {selectedImages.size} image
                {selectedImages.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={handleBulkDownload}
                variant="default"
                size="sm"
                className="h-8"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button
                onClick={handleCSVExport}
                variant="outline"
                size="sm"
                className="h-8"
              >
                CSV Format
              </Button>
              <Button
                onClick={handleJSONExport}
                variant="outline"
                size="sm"
                className="h-8"
              >
                JSON Format
              </Button>
            </div>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Found {images.length} image{images.length !== 1 ? "s" : ""} on this
          page
          {filteredImages.length !== images.length && (
            <span className="ml-2 text-xs">
              (showing {filteredImages.length} filtered)
            </span>
          )}
          {sortBy !== "size" && (
            <span className="ml-2 text-xs">
              (sorted by {sortBy}{" "}
              {sortOrder === "asc" ? "ascending" : "descending"})
            </span>
          )}
        </p>
      )}

      {images.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No images found on this page</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try navigating to a page with images and click Refresh
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            checked={
              selectedImages.size === sortedImages.length &&
              sortedImages.length > 0
            }
            onCheckedChange={handleSelectAll}
            id="select-all"
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium text-foreground"
          >
            Select All ({selectedImages.size}/{sortedImages.length})
          </label>
        </div>
      )}

      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
        {sortedImages.map((image) => (
          <div
            key={image.id}
            className="break-inside-avoid mb-4 overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                loading="lazy"
                onClick={() =>
                  handleImageSelect(image.id, !selectedImages.has(image.id))
                }
              />
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selectedImages.has(image.id)}
                  onCheckedChange={(checked) =>
                    handleImageSelect(image.id, checked as boolean)
                  }
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="p-3 bg-card">
              <p className="text-sm text-muted-foreground truncate">
                {image.alt}
              </p>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p>
                  {image.width} × {image.height}
                </p>
                {image.size && <p>Size: {formatFileSize(image.size)}</p>}
                {image.mimetype && (
                  <p className="truncate">Type: {image.mimetype}</p>
                )}
              </div>
              <div className="flex justify-end gap-1 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(image.url, image.alt)}
                  title="Download image"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopyLink(image.url)}
                  title="Copy image URL"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleExternalLink(image.url)}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toaster />
    </div>
  );
}
