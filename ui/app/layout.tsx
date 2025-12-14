// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Knowledge Base Admin - YPI Al-Azhar',
  description: 'Knowledge Base Management System untuk YPI Al-Azhar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#166534',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
