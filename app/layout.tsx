import type { Metadata } from 'next';
import './globals.css';
{<meta name="apple-mobile-web-app-capable" content="yes" />}

export const metadata: Metadata = {
  title: 'CICAPORA Sport Climbing',
  description: 'Monitoring Performa Atlet Sport Climbing',
  icons: {
    icon: '/logo.png',
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        background: '#0a1428',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        {children}
      </body>
    </html>
  );
}