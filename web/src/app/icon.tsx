import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #A5F3FC 0%, #22D3EE 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        }}
      >
        <svg viewBox="0 0 108 108" width="24" height="24">
          <path d="M 28,40 L 40,70 L 52,40" fill="none" stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 56,70 L 68,40 L 80,70" fill="none" stroke="white" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
