'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function TerminalComponent() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Ensure the container has dimensions before initializing
    const initTerminal = () => {
      if (!terminalRef.current || terminalRef.current.offsetWidth === 0 || terminalRef.current.offsetHeight === 0) {
        // Retry after a short delay if container isn't ready
        setTimeout(initTerminal, 50);
        return;
      }

      const term = new Terminal({
      theme: {
        background: '#0a0011',
        foreground: '#0FFF50',
        cursor: '#0FFF50',
        cursorAccent: '#0a0011',
        selectionBackground: 'rgba(15, 255, 80, 0.3)',
        black: '#000000',
        red: '#FF10F0',
        green: '#0FFF50',
        yellow: '#FFFF00',
        blue: '#00F0FF',
        magenta: '#9D00FF',
        cyan: '#00F0FF',
        white: '#FFFFFF',
        brightBlack: '#666666',
        brightRed: '#FF6B00',
        brightGreen: '#0FFF50',
        brightYellow: '#FFFF00',
        brightBlue: '#00F0FF',
        brightMagenta: '#FF10F0',
        brightCyan: '#00F0FF',
        brightWhite: '#FFFFFF'
      },
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
    });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      term.open(terminalRef.current);
      
      // Ensure terminal is properly initialized before fitting
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (error) {
          console.error('Error during initial terminal fit:', error);
          // Try again after a short delay
          setTimeout(() => {
            try {
              fitAddon.fit();
            } catch (retryError) {
              console.error('Error during terminal fit retry:', retryError);
            }
          }, 100);
        }
      });

    // Welcome message
    term.writeln('\x1b[1;35m╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;35m║\x1b[0m  \x1b[1;36m🤖 BODAL.DEV TERMINAL v1.0 🤖\x1b[0m                                     \x1b[1;35m║\x1b[0m');
    term.writeln('\x1b[1;35m╚════════════════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[1;32mComing soon to a terminal near you...\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[33mType "help" to see available commands\x1b[0m');
    term.writeln('');
    term.write('\x1b[1;36m$ \x1b[0m');

    // Focus immediately
    term.focus();

    // Handle user input
    let currentLine = '';
    let commandHistory: string[] = [];
    let historyIndex = -1;

    // Command processor
    const processCommand = (cmd: string) => {
      const args = cmd.split(' ');
      const command = args[0]?.toLowerCase();

      switch (command) {
        case 'help':
          term.writeln('\x1b[1;33mAvailable commands:\x1b[0m');
          term.writeln('  \x1b[36mhelp\x1b[0m            - Show this help message');
          term.writeln('  \x1b[36mclear\x1b[0m           - Clear the terminal');
          term.writeln('  \x1b[36mdate\x1b[0m            - Show current date and time');
          term.writeln('  \x1b[36mecho\x1b[0m            - Echo back your message');
          term.writeln('  \x1b[36mdigital-bloom\x1b[0m   - Launch interactive art playground');
          break;
        
        case 'clear':
          term.clear();
          break;
        
        case 'date':
          term.writeln(new Date().toString());
          break;
        
        case 'echo':
          if (args.length > 1) {
            term.writeln(args.slice(1).join(' '));
          }
          break;

        case 'digital-bloom':
          term.writeln('\x1b[1;35m✨ Launching Digital Bloom...\x1b[0m');
          term.writeln('\x1b[1;32mOpening interactive art playground in new window\x1b[0m');
          setTimeout(() => {
            window.open('/digital-bloom', '_blank');
          }, 500);
          break;

        case '':
          // Empty command, do nothing
          break;

        default:
          if (command) {
            term.writeln(`\x1b[1;31mCommand not found:\x1b[0m ${command}`);
            term.writeln('Type \x1b[1;36mhelp\x1b[0m for available commands');
          }
      }
      
      term.write('\x1b[1;36m$ \x1b[0m');
    };

    term.onData((data) => {
      const code = data.charCodeAt(0);
      
      // Handle special keys
      if (code === 127) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 13) { // Enter
        term.writeln('');
        if (currentLine.trim()) {
          commandHistory.push(currentLine);
          historyIndex = commandHistory.length;
        }
        processCommand(currentLine.trim());
        currentLine = '';
      } else if (code === 27) { // Escape sequences (arrows)
        if (data === '\x1b[A') { // Up arrow
          if (historyIndex > 0) {
            // Clear current line
            for (let i = 0; i < currentLine.length; i++) {
              term.write('\b \b');
            }
            historyIndex--;
            currentLine = commandHistory[historyIndex];
            term.write(currentLine);
          }
        } else if (data === '\x1b[B') { // Down arrow
          if (historyIndex < commandHistory.length - 1) {
            for (let i = 0; i < currentLine.length; i++) {
              term.write('\b \b');
            }
            historyIndex++;
            currentLine = commandHistory[historyIndex];
            term.write(currentLine);
          } else if (historyIndex === commandHistory.length - 1) {
            for (let i = 0; i < currentLine.length; i++) {
              term.write('\b \b');
            }
            historyIndex = commandHistory.length;
            currentLine = '';
          }
        }
      } else if (code === 3) { // Ctrl+C
        term.writeln('^C');
        currentLine = '';
        term.write('\x1b[1;36m$ \x1b[0m');
      } else if (code < 32) { // Other control characters
        // Ignore
      } else { // Regular characters
        currentLine += data;
        term.write(data);
      }
    });

      xtermRef.current = term;

      // Handle resize
      const handleResize = () => {
        if (fitAddon && xtermRef.current) {
          try {
            fitAddon.fit();
          } catch (error) {
            console.error('Error during terminal resize:', error);
          }
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (term) {
          term.dispose();
        }
      };
    };

    // Start the initialization
    initTerminal();
  }, []);

  return (
    <div className="terminal-container w-full h-[500px]" onClick={() => xtermRef.current?.focus()}>
      <div className="terminal-header">
        <div className="flex gap-2">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
        </div>
        <div className="flex-1 text-center text-sm text-gray-400">
          bodal@dev:~$ agentic-terminal
        </div>
      </div>
      <div ref={terminalRef} className="h-[calc(100%-40px)] bg-black/90 p-4 cursor-text" />
    </div>
  );
}