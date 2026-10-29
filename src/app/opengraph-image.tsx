import { ImageResponse } from 'next/og';

import { siteConfig } from '@/config/site';

// Link preview card (Open Graph + Twitter). ImageResponse only understands inline styles.
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 32,
        padding: 96,
        background: siteConfig.colors.dark,
        color: '#f4f4f5',
      }}
    >
      <div
        style={{
          width: 112,
          height: 112,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
          background: siteConfig.colors.primary,
        }}
      >
        <svg width="56" height="56" viewBox="0 0 32 32">
          <path d="M10 6v20L26 16z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: -2 }}>Just watched a movie?</div>
      <div style={{ fontSize: 32, color: '#a1a1aa' }}>{siteConfig.description}</div>
    </div>,
    size,
  );
}
