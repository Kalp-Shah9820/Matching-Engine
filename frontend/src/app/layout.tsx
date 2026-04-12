import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Matching Engine',
  description: 'AI-powered job-candidate ranking system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
