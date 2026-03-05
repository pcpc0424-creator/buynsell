'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiUrl, getImageUrl, isLocalUpload } from '@/lib/config';

interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
}

interface AdBannerProps {
  position: 'MAIN_BANNER' | 'SIDEBAR' | 'LIST_TOP' | 'LIST_BOTTOM' | 'PROPERTY_DETAIL';
  className?: string;
}

export default function AdBanner({ position, className = '' }: AdBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(apiUrl(`/api/advertisements?position=${position}`));
        const data = await res.json();
        if (data.success) {
          setAds(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position]);

  // Auto-rotate ads every 5 seconds
  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const handleClick = async (adId: string) => {
    try {
      await fetch(apiUrl('/api/advertisements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId }),
      });
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  // Different aspect ratios for different positions
  const getAspectRatio = () => {
    switch (position) {
      case 'MAIN_BANNER':
        return 'aspect-[21/9] sm:aspect-[21/6]'; // Wide banner
      case 'SIDEBAR':
        return 'aspect-[16/9] sm:aspect-[21/9]'; // Medium
      case 'LIST_TOP':
      case 'LIST_BOTTOM':
        return 'aspect-[16/9] sm:aspect-[21/6]'; // List banners
      case 'PROPERTY_DETAIL':
        return 'aspect-[16/9] sm:aspect-[21/9]'; // Detail page
      default:
        return 'aspect-[16/9]';
    }
  };

  const renderAd = (ad: Advertisement) => {
    const imageElement = (
      <div className={`relative w-full ${getAspectRatio()} rounded-2xl overflow-hidden bg-slate-100`}>
        <Image
          src={getImageUrl(ad.imageUrl)}
          alt={ad.title}
          fill
          className="object-contain"
          unoptimized={isLocalUpload(ad.imageUrl)}
        />
      </div>
    );

    if (ad.linkUrl) {
      const href = ad.linkUrl.startsWith('http') ? ad.linkUrl : `https://${ad.linkUrl}`;
      return (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick(ad.id)}
          className="block hover:opacity-95 transition-opacity"
        >
          {imageElement}
        </Link>
      );
    }

    return imageElement;
  };

  return (
    <section className={`relative ${className}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {renderAd(currentAd)}

        {/* Dots indicator for multiple ads */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-accent-blue w-6'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
