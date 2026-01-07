'use client';

import Link from 'next/link';
import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <PageTransition>
        <GlassCard
          className="p-8 max-w-md w-full text-center"
          spotlightColor="rgba(99, 102, 241, 0.15)"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Pendu</h1>

          <p className="text-gray-300 mb-8">Le jeu du pendu en famille !</p>

          <div className="flex flex-col gap-4">
            {/* Solo Mode */}
            <Link
              href="/solo"
              className="
                group block w-full py-4 px-6
                bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30
                text-white text-xl font-semibold
                rounded-xl
                transition-all duration-200 hover:scale-[1.02]
                focus:outline-none focus:ring-4 focus:ring-blue-500/50
              "
            >
              Solo
              <span className="block text-sm font-normal opacity-75 group-hover:opacity-100">
                Joue seul contre l&apos;ordinateur
              </span>
            </Link>

            {/* Coop Mode */}
            <Link
              href="/coop"
              className="
                group block w-full py-4 px-6
                bg-green-500 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30
                text-white text-xl font-semibold
                rounded-xl
                transition-all duration-200 hover:scale-[1.02]
                focus:outline-none focus:ring-4 focus:ring-green-500/50
              "
            >
              Coop
              <span className="block text-sm font-normal opacity-75 group-hover:opacity-100">
                Jouez ensemble contre l&apos;ordinateur
              </span>
            </Link>

            {/* PvP Mode */}
            <Link
              href="/pvp"
              className="
                group block w-full py-4 px-6
                bg-pink-500 hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30
                text-white text-xl font-semibold
                rounded-xl
                transition-all duration-200 hover:scale-[1.02]
                focus:outline-none focus:ring-4 focus:ring-pink-500/50
              "
            >
              PvP
              <span className="block text-sm font-normal opacity-75 group-hover:opacity-100">
                Un joueur choisit le mot
              </span>
            </Link>
          </div>

          <p className="text-gray-400 text-xs mt-8">Pendu Multijoueur PWA</p>
        </GlassCard>
      </PageTransition>
    </main>
  );
}
