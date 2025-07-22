import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { useState, useRef } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useFileUpload = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const validateFile = (file: File): string | null => {
        if (!file.type.startsWith("image/")) {
            return "Please select a valid image file (JPG, PNG, GIF, WebP)";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "File size should not exceed 10MB";
        }
        return null;
    };

    const handleImageClick = () => {
        imageInputRef.current?.click();
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            setError(null);
            setSelectedImage(file);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setError(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const uploadImage = async (url: string): Promise<{ url: string } | null> => {
        if (!selectedImage) return null;

        const formData = new FormData();
        formData.append('avatar', selectedImage);

        try {
            const token = localStorage.getItem('passport_buddy_token');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload image');
            }

            const data = await response.json();
            return data.data.avatar;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload image');
            return null;
        }
    };

    return {
        selectedImage,
        previewUrl,
        error,
        imageInputRef,
        handleImageClick,
        handleImageChange,
        removeImage,
        uploadImage,
    };
};