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
      <body className="text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950 min-h-screen">
        <Providers>
          <div className="min-h-screen flex flex-col pb-20 md:pb-0">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
