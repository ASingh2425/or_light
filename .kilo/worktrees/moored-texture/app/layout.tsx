import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MANU Protocol // Orange Zone: Forensics Archive',
  description: 'Interactive CTF Forensics Investigation and Dataset Recovery Portal for the MANU Protocol competition.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-darker text-gray-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
