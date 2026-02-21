import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pendu - Jeu du Pendu Multijoueur',
  description: 'Jeu du pendu en ligne multijoueur. Jouez seul, en coop ou en PvP avec vos amis !',
  keywords: ['pendu', 'hangman', 'jeu', 'multijoueur', 'coop', 'pvp'],
  authors: [{ name: 'Pendu Team' }],
  manifest: '/manifest.json',
  icons: [
    { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icons/apple-touch-icon.png', sizes: '180x180' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pendu',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f2937',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
