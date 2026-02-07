import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${className}`}>
      {/* Skeleton / Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
           <ImageIcon className="text-gray-300 w-1/3 h-1/3" />
        </div>
      )}
      
      {/* Actual Image */}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsLoaded(true);
            setHasError(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      ) : (
        // Fallback Design with HAHA LAB text (SVG for perfect scaling)
        // Updated: Smaller font sizes for a more subtle look
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8F8F8]">
           <svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="opacity-15 select-none">
              <text x="100" y="60" textAnchor="middle" fill="#3A1D1D" fontSize="28" fontFamily="sans-serif" fontWeight="900" letterSpacing="-1">HAHA</text>
              <text x="100" y="82" textAnchor="middle" fill="#3A1D1D" fontSize="14" fontFamily="sans-serif" fontWeight="bold" letterSpacing="3">LAB</text>
           </svg>
        </div>
      )}
    </div>
  );
};