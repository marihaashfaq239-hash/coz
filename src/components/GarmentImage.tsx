import { useEffect, useState } from 'react';
import { Product } from '../data/products';
import {
  getCachedRecoloredProductImage,
  getRecoloredProductImage,
} from '../utils/garmentRecolor';
import { ResilientImage } from './ResilientImage';

interface GarmentImageProps {
  product: Product;
  colorName?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function GarmentImage({
  product,
  colorName,
  alt,
  className = 'w-full h-full object-cover object-top',
  fallbackLabel,
}: GarmentImageProps) {
  const activeColorName = colorName || product.variants[0]?.name || product.color;
  const baseColorName = product.variants[0]?.name || product.color;
  const isOriginal = activeColorName === baseColorName;

  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (isOriginal) return product.image;
    return getCachedRecoloredProductImage(product, activeColorName) ?? product.image;
  });

  useEffect(() => {
    if (isOriginal) {
      setResolvedSrc(product.image);
      return;
    }

    const immediate = getCachedRecoloredProductImage(product, activeColorName);
    if (immediate) {
      setResolvedSrc(immediate);
      return;
    }

    let cancelled = false;
    void getRecoloredProductImage(product, activeColorName).then((url) => {
      if (!cancelled) {
        setResolvedSrc(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [product, activeColorName, isOriginal]);

  return (
    <ResilientImage
      src={resolvedSrc}
      alt={alt}
      className={className}
      fallbackLabel={fallbackLabel ?? product.name}
    />
  );
}
