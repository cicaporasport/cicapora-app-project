import type { Metadata, Viewport } from 'next';
import './globals.css';
import StandaloneGuard from './components/StandaloneGuard';

export const metadata: Metadata = {
  title: 'CICAPORA Sport Climbing',
  description: 'Monitoring Performa Atlet Sport Climbing',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CICAPORA',
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0a1428',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <StandaloneGuard>
          {children}
        </StandaloneGuard>
      </body>
    </html>
  );
}