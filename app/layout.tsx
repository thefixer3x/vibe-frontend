import 'tw-animate-css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SWRConfig } from 'swr';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Vibe - Universal API Warehouse',
  description: 'Manage and test all your APIs in one place. Built with Next.js.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const inter = Inter({
  subsets: ['latin'],
  fallback: ['system-ui', 'arial']
});

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${inter.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // Empty fallback - data will be fetched client-side
            }
          }}
        >
          {children}
          <Toaster />
        </SWRConfig>
      </body>
    </html>
  );
}
