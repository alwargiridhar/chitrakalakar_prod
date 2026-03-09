import React, { useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));

export default function AdaptiveArtworkImage({
  src,
  alt,
  settings = null,
  className = '',
  dataTestId,
}) {
  const [fitMode, setFitMode] = useState('contain');

  const zoom = clamp(settings?.zoom ?? 1, 1, 2.5);
  const focusX = clamp(settings?.focus_x ?? 50, 0, 100);
  const focusY = clamp(settings?.focus_y ?? 50, 0, 100);

  const computedFitClass = useMemo(() => {
    if (settings?.fit_mode === 'cover') return 'object-cover';
    if (settings?.fit_mode === 'contain') return 'object-contain';
    return fitMode === 'cover' ? 'object-cover' : 'object-contain';
  }, [settings?.fit_mode, fitMode]);

  const handleLoad = (event) => {
    if (settings?.fit_mode) return;
    const img = event.currentTarget;
    const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    const adaptiveFit = ratio > 0.9 && ratio < 1.7 ? 'cover' : 'contain';
    setFitMode(adaptiveFit);
  };

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleLoad}
      data-testid={dataTestId}
      className={`w-full h-full object-center ${computedFitClass} ${className}`}
      style={{
        transform: zoom > 1 ? `scale(${zoom})` : undefined,
        transformOrigin: `${focusX}% ${focusY}%`,
        objectPosition: `${focusX}% ${focusY}%`,
      }}
    />
  );
}
