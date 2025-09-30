'use client';

import { useEffect } from 'react';

export default function DigitalBloomPage() {
  useEffect(() => {
    // Replace the current page completely with the static HTML
    window.location.replace('/digital-bloom/index.html');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-500 to-green-500 animate-pulse">
          Loading Digital Bloom...
        </h1>
        <p className="text-gray-400">Interactive generative art playground</p>
      </div>
    </div>
  );
}