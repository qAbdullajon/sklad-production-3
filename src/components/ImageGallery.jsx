import { Eye, Download, X, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { notification } from "./notification";

const ImageGallery = ({ eventImages, triggerImageUploadConfirm, setPendingImages, eventId }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setSelectedImage(null);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and size
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(
      (file) => !validImageTypes.includes(file.type) || file.size > maxSizeInBytes
    );

    if (invalidFiles.length > 0) {
      notification(
        "Faqat JPEG, PNG yoki GIF formatidagi va 5MB dan kichik rasmlar yuklanishi mumkin",
        "error"
      );
      return;
    }

    // Create preview URLs for selected images
    const imagePreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...imagePreviews]);
    triggerImageUploadConfirm();

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup preview URLs for pending images only
  useEffect(() => {
    return () => {
      setPendingImages((prev) => {
        prev.forEach((image) => {
          if (image.url && image.url.startsWith("blob:")) {
            URL.revokeObjectURL(image.url);
          }
        });
        return [];
      });
    };
  }, [setPendingImages]);

  // Handle image loading errors
  const handleImageError = (e, index) => {
    console.error(`Failed to load image at index ${index}: ${e.target.src}`);
    notification(`Rasmni yuklashda xatolik: Rasm ${index + 1}`, "error");
    // Optionally remove the image from the DOM
    e.target.style.display = "none";
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-4">
        {/* Add Image Area */}
        <div
          onClick={triggerFileInput}
          className="relative w-[200px] aspect-square flex items-center justify-center bg-gray-100 rounded-md border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Rasm qo'shish</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            multiple
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
        </div>

        {/* Existing Images */}
        {eventImages?.length > 0 ? (
          eventImages.map((item, index) => {
            const imageUrl = item.url || `${import.meta.env.VITE_BASE_URL}${item}`;
            return (
              <div
                key={`${item.url || item}-${index}`}
                className="relative w-[200px] aspect-square group overflow-hidden rounded-md border border-gray-300 shadow-xl shadow-gray-200"
              >
                <img
                  src={imageUrl}
                  alt={`Event image ${index + 1}`}
                  className="object-cover w-full h-full"
                  onError={(e) => handleImageError(e, index)}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedImage(imageUrl)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-[#249B73] transition-colors"
                    aria-label="View image"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {/* <a
                    href={imageUrl}
                    download
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-[#249B73] transition-colors"
                    aria-label="Download image"
                  >
                    <Download className="w-5 h-5" />
                  </a> */}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">Hozircha rasmlar mavjud emas</p>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl shadow-lg p-4"
          >
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              onError={() => {
                notification("Rasmni ko'rsatishda xatolik yuz berdi", "error");
                setSelectedImage(null);
              }}
            />
            <div className="absolute -top-4 -right-4 flex gap-2">
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 bg-[#249B73] rounded-full text-white hover:bg-red-500 transition-colors shadow-md"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;