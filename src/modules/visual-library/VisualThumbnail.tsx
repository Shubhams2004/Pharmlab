import React, { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { resolveVisualImageSrc } from './visualDb';
import { VisualMediaItem } from './types';

interface VisualThumbnailProps {
  item: VisualMediaItem;
  className?: string;
  imgClassName?: string;
}

export default function VisualThumbnail({
  item,
  className = '',
  imgClassName = 'w-full h-full object-contain'
}: VisualThumbnailProps) {
  const [src, setSrc] = useState<string | null>(item?.assetUrl || null);
  const [loading, setLoading] = useState(Boolean(item && !item.assetUrl));
  const [failed, setFailed] = useState(!item);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (!item) {
      setSrc(null);
      setLoading(false);
      setFailed(true);
      return;
    }

    if (item.assetUrl) {
      setSrc(item.assetUrl);
      setLoading(false);
      return;
    }

    setLoading(true);
    resolveVisualImageSrc(item)
      .then((resolved) => {
        if (!cancelled) {
          setSrc(resolved);
          setLoading(false);
          if (!resolved) setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-950 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-950 text-slate-400 p-4 text-center ${className}`}
      >
        <ImageOff className="w-6 h-6" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
          {item?.title || 'Visual preview'}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-slate-50 dark:bg-slate-950 ${className}`}>
      <img
        src={src}
        alt={item?.title || 'Visual preview'}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    </div>
  );
}
