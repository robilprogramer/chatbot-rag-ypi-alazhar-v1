// Root Layout Component
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YPI Al-Azhar - Chatbot Pendaftaran',
  description: 'Sistem chatbot berbasis AI untuk pendaftaran siswa baru YPI Al-Azhar Jakarta',
  keywords: ['YPI Al-Azhar', 'Pendaftaran', 'Chatbot', 'AI', 'Siswa Baru'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
