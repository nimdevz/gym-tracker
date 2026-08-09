import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Gym Tracker - Serious Strength & Workout Logger',
  description: 'Track workouts, personal records, volume, 1RM progression, and personal fitness intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950 relative min-h-screen">
        {/* Visible Ambient Green Hues Background Gradient */}
        <div className="bg-ambient-gradient">
          <div className="bg-ambient-blob-1" />
          <div className="bg-ambient-blob-2" />
          <div className="bg-ambient-blob-3" />
        </div>

        <Providers>
          <div className="min-h-screen flex flex-col pb-20 md:pb-0 relative z-0">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
