import { useEffect, useState } from 'react';
import { fetchBanners } from '../lib/banners';

const ROTATE_MS = 5000;

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await fetchBanners();
        if (mounted) setBanners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn('Failed to load banners', error);
        if (mounted) setBanners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return (
      <section
        className="container"
        style={{
          padding: '1rem 20px 0',
          minHeight: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        Loading banners...
      </section>
    );
  }

  if (!banners.length) return null;

  return (
    <section className="container" style={{ padding: '1rem 20px 0' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#111',
          aspectRatio: '21 / 8',
          minHeight: '180px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
        }}
      >
        {banners.map((banner, index) => (
          <img
            key={banner.id}
            src={banner.image_url}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: index === activeIndex ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
            }}
          />
        ))}

        {banners.length > 1 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '14px',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
            }}
          >
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Show banner ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                style={{
                  width: index === activeIndex ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: index === activeIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BannerCarousel;
