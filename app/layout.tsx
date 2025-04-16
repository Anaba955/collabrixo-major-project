// app/layout.tsx

import './globals.css';
import NavbarHeroUI from '@/components/navbar/NavbarHeroUI';
import { ReactNode } from 'react';



export const metadata = {
  title: 'My Landing Page',
  description: 'A beautiful landing page built with Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body >
      <NavbarHeroUI />

        {children}
        <footer className="bg-neutral-900 text-neutral-400 text-center py-6 mt-10">
          <p className="text-sm">© 2025 Collabrixo. All rights reserved.</p>  </footer>
      </body>
    </html>
  );
}
