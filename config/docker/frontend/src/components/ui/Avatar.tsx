import React from 'react';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface AvatarImageProps {
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface AvatarFallbackProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ className = '', children, style }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100 ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '50%',
        backgroundColor: '#f3f4f6',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const AvatarImage: React.FC<AvatarImageProps> = ({ src, className = '', style }) => {
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt="Avatar"
      className={`h-full w-full object-cover ${className}`}
      style={{
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        ...style
      }}
    />
  );
};

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className = '', children, style }) => {
  return (
    <span 
      className={`flex h-full w-full items-center justify-center bg-gray-200 text-gray-600 ${className}`}
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e5e7eb',
        color: '#4b5563',
        borderRadius: '50%',
        ...style
      }}
    >
      {children}
    </span>
  );
};