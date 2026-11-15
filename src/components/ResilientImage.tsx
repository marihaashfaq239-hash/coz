import { Shirt } from 'lucide-react';
import { CSSProperties, useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  style,
  fallbackLabel,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Shirt className="w-8 h-8 mb-2 stroke-[1.5]" aria-hidden="true" />
        <span className="text-xs font-medium text-neutral-500">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      style={style}
      className={className}
    />
  );
}
