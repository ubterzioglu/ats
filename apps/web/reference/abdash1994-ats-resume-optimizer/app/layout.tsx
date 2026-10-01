import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { PWAInit } from '@/components/PWAInit';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ATS Resume Optimizer — Beat Every ATS Filter',
  description: 'Free, offline-capable tool to optimize your resume for 15+ ATS systems including Taleo, Workday, Greenhouse. Real-time scoring, gap analysis, and one-click fixes.',
  keywords: ['ATS', 'resume optimizer', 'ATS score', 'resume parser', 'job application', 'Taleo', 'Workday', 'Greenhouse'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ATS Resume Optimizer',
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100`}>
        <PWAInit />
        {children}
      </body>
    </html>
  );
}
