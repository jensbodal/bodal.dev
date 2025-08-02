'use client';

import { useState } from 'react';

export default function TerminalDebug() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([
    'BODAL.DEV DEBUG TERMINAL',
    'Type "help" for commands',
    ''
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newOutput = [...output, `$ ${input}`];
    
    // Simple command processing
    switch (input.toLowerCase()) {
      case 'help':
        newOutput.push('Available commands: help, about, clear, echo <message>');
        break;
      case 'about':
        newOutput.push('Debug terminal for testing interactivity');
        break;
      case 'clear':
        setOutput(['']);
        setInput('');
        return;
      default:
        if (input.toLowerCase().startsWith('echo ')) {
          newOutput.push(input.substring(5));
        } else {
          newOutput.push(`Command not found: ${input}`);
        }
    }
    
    newOutput.push('');
    setOutput(newOutput);
    setInput('');
  };

  return (
    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[400px] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {output.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center mt-2">
        <span className="mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          autoFocus
        />
      </form>
    </div>
  );
}