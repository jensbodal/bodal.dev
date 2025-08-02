'use client';

import dynamic from 'next/dynamic';
import TerminalDebug from '../components/TerminalDebug';

const Terminal = dynamic(() => import('../components/Terminal'), {
  ssr: false,
  loading: () => <div>Loading xterm terminal...</div>
});

export default function TerminalTestPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Terminal Test Page</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Debug Terminal (Simple React)</h2>
          <p className="text-gray-400 mb-4">This should work immediately - type "help" and press Enter:</p>
          <TerminalDebug />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. XTerm Terminal</h2>
          <p className="text-gray-400 mb-4">Click on the terminal to focus, then type "help":</p>
          <Terminal />
        </section>

        <section className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Troubleshooting:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>If Terminal 1 works but Terminal 2 doesn&apos;t, it&apos;s an xterm focus issue</li>
            <li>Try clicking inside the black area of Terminal 2</li>
            <li>Check browser console for any errors (F12)</li>
            <li>The cursor should be blinking when focused</li>
          </ul>
        </section>
      </div>
    </main>
  );
}