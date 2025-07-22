import React from 'react';

interface MediaPreviewProps {
  previewUrl: string | null;
  selectedImage: File | null;
  selectedVideo: File | null;
  onRemoveMedia: () => void;
  isLoading?: boolean;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  previewUrl,
  selectedImage,
  selectedVideo,
  onRemoveMedia,
  isLoading = false,
}) => {
  if (!previewUrl) return null;

  return (
    <div style={{ position: 'relative', marginTop: '1rem' }}>
      {selectedImage && (
        <img
          src={previewUrl}
          alt="Preview"
          style={{
            width: '100%',
            borderRadius: '0.5rem',
            objectFit: 'cover',
            maxHeight: '300px'
          }}
        />
      )}
      {selectedVideo && (
        <video
          src={previewUrl}
          controls
          style={{
            width: '100%',
            borderRadius: '0.5rem',
            maxHeight: '300px'
          }}
        />
      )}
      {!isLoading && (
        <button
          onClick={onRemoveMedia}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            borderRadius: '50%',
            padding: '0.25rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: '1.25rem', width: '1.25rem' }}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MediaPreview;