import { ImageResponse } from 'next/og';

import { siteConfig } from '@/config/site';

// PNG version of icon.svg: iOS ignores SVG icons. ImageResponse only understands inline styles.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: siteConfig.colors.primary,
      }}
    >
      <svg width="96" height="96" viewBox="0 0 32 32">
        <path d="M10 6v20L26 16z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>,
    size,
  );
}
