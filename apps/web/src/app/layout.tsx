import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/Navbar';
import { InteractiveGradientBg } from '@/components/InteractiveGradientBg';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Pulse — Strength & Workout Tracker',
  description: 'Train as a guest or sign in to save privately. Log workouts, track PRs, volume, 1RM and personal insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${grotesk.variable} text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950 relative min-h-screen grain`}>
        <div className="aurora" aria-hidden />
        <InteractiveGradientBg />
        <Providers>
          <div className="min-h-screen flex flex-col pb-24 md:pb-0 relative z-0">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
