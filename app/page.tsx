'use client';

import dynamic from 'next/dynamic';

const Terminal = dynamic(() => import('./components/Terminal'), {
  ssr: false,
  loading: () => (
    <div className="terminal-container w-full h-[500px] flex items-center justify-center">
      <div className="text-neon-green animate-pulse">Loading terminal...</div>
    </div>
  )
});

export default function HomePage() {
  return (
    <main className="container">
      <section className="min-h-screen flex flex-col items-center justify-center relative py-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 text-center mb-12">
          <h1 className="text-7xl md:text-8xl font-bold mb-6 animate-pulse-neon">
            BODAL.DEV
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto">
            <span className="text-neon-pink glow-text">give me a tool</span>{', '}
            <span className="text-neon-blue">and</span>{' '}
            <span className="text-neon-green glow-text">i can use it</span>{'.'}
          </p>
          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="px-4 py-2 border border-neon-purple/50 rounded-full text-neon-purple">
              🚀 Developer
            </span>
            <span className="px-4 py-2 border border-neon-green/50 rounded-full text-neon-green">
              🤖 AI Enthusiast
            </span>
            <span className="px-4 py-2 border border-neon-pink/50 rounded-full text-neon-pink">
              💡 Creator
            </span>
          </div>
        </div>

        {/* Terminal Component */}
        <div className="w-full max-w-5xl mb-20">
          <Terminal />
        </div>

      </section>


    </main>
  );
}