import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Pendu</h1>

        <p className="text-gray-300 mb-8">Le jeu du pendu en famille !</p>

        <div className="flex flex-col gap-4">
          {/* Solo Mode */}
          <Link
            href="/solo"
            className="
              block w-full py-4 px-6
              bg-blue-500 hover:bg-blue-600
              text-white text-xl font-semibold
              rounded-xl
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-blue-500/50
            "
          >
            Solo
            <span className="block text-sm font-normal opacity-75">
              Joue seul contre l&apos;ordinateur
            </span>
          </Link>

          {/* Coop Mode */}
          <Link
            href="/coop"
            className="
              block w-full py-4 px-6
              bg-green-500 hover:bg-green-600
              text-white text-xl font-semibold
              rounded-xl
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-green-500/50
            "
          >
            Coop
            <span className="block text-sm font-normal opacity-75">
              Jouez ensemble contre l&apos;ordinateur
            </span>
          </Link>

          {/* PvP Mode */}
          <Link
            href="/pvp"
            className="
              block w-full py-4 px-6
              bg-pink-500 hover:bg-pink-600
              text-white text-xl font-semibold
              rounded-xl
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-pink-500/50
            "
          >
            PvP
            <span className="block text-sm font-normal opacity-75">Un joueur choisit le mot</span>
          </Link>
        </div>

        <p className="text-gray-500 text-xs mt-8">Pendu Multijoueur PWA</p>
      </div>
    </main>
  );
}
