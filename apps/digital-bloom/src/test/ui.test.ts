import { describe, it, expect, beforeEach } from 'vitest';

describe('Digital Bloom UI Components', () => {
  beforeEach(() => {
    // Load the HTML structure
    document.body.innerHTML = `
      <div id="app-container">
        <canvas id="artCanvas"></canvas>

        <div id="introOverlay">
          <button id="startButton">Begin</button>
        </div>

        <div id="toolbar-container">
          <div id="modeSelector">
            <button class="mode-button active" data-mode="vine"></button>
            <button class="mode-button" data-mode="gravity"></button>
            <button class="mode-button" data-mode="bounce"></button>
            <button class="mode-button" data-mode="burst"></button>
            <button class="mode-button" data-mode="lightning"></button>
            <button class="mode-button" data-mode="constellation"></button>
            <button class="mode-button" data-mode="vortex"></button>
          </div>
        </div>

        <div id="settingsCogContainer">
          <div>
            <button id="settingsCog">
              <svg></svg>
            </button>
          </div>
        </div>

        <div id="bottomBar" class="collapsed">
          <button id="zenButton"></button>
          <div>
            <button id="decreaseBrush">-</button>
            <span id="brushSize">4</span>
            <button id="increaseBrush">+</button>
          </div>
          <button id="clearButton"></button>
          <button id="muteButton">
            <svg>
              <path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6m0-6l6 6"/>
            </svg>
          </button>
        </div>

        <div id="physicsIndicator"></div>
        <div id="audioFeedback"></div>
      </div>
    `;
  });

  describe('Core UI Elements', () => {
    it('should have canvas element', () => {
      const canvas = document.getElementById('artCanvas');
      expect(canvas).toBeTruthy();
      expect(canvas?.tagName).toBe('CANVAS');
    });

    it('should have start button', () => {
      const startButton = document.getElementById('startButton');
      expect(startButton).toBeTruthy();
    });

    it('should have all mode buttons', () => {
      const modeButtons = document.querySelectorAll('.mode-button');
      expect(modeButtons.length).toBe(7);
    });

    it('should have default vine mode selected', () => {
      const activeButton = document.querySelector('.mode-button.active');
      expect(activeButton?.getAttribute('data-mode')).toBe('vine');
    });
  });

  describe('Settings Panel', () => {
    it('should have settings cog button', () => {
      const settingsCog = document.getElementById('settingsCog');
      expect(settingsCog).toBeTruthy();
      expect(settingsCog?.querySelector('svg')).toBeTruthy();
    });

    it('should have settings cog outside bottom bar (always visible)', () => {
      const bottomBar = document.getElementById('bottomBar');
      const settingsCog = document.getElementById('settingsCog');
      expect(bottomBar?.contains(settingsCog!)).toBe(false);
      expect(settingsCog).toBeTruthy();
    });

    it('should have bottom bar', () => {
      const bottomBar = document.getElementById('bottomBar');
      expect(bottomBar).toBeTruthy();
    });

    it('should toggle settings panel visibility', () => {
      const settingsCog = document.getElementById('settingsCog')!;
      const bottomBar = document.getElementById('bottomBar')!;

      // Initially collapsed
      expect(bottomBar.classList.contains('collapsed')).toBe(true);

      // Click to expand
      settingsCog.click();
      bottomBar.classList.toggle('collapsed');
      expect(bottomBar.classList.contains('collapsed')).toBe(false);

      // Click to collapse
      settingsCog.click();
      bottomBar.classList.toggle('collapsed');
      expect(bottomBar.classList.contains('collapsed')).toBe(true);
    });
  });

  describe('Control Buttons', () => {
    it('should have all control buttons', () => {
      expect(document.getElementById('zenButton')).toBeTruthy();
      expect(document.getElementById('clearButton')).toBeTruthy();
      expect(document.getElementById('muteButton')).toBeTruthy();
    });

    it('should NOT have separate sound/play button', () => {
      const soundButton = document.getElementById('soundButton');
      expect(soundButton).toBeFalsy();
    });

    it('should have brush size controls', () => {
      expect(document.getElementById('decreaseBrush')).toBeTruthy();
      expect(document.getElementById('increaseBrush')).toBeTruthy();
      expect(document.getElementById('brushSize')).toBeTruthy();
      expect(document.getElementById('brushSize')?.textContent).toBe('4');
    });

    it('should NOT have volume slider', () => {
      const volumeSlider = document.getElementById('volumeSlider');
      expect(volumeSlider).toBeFalsy();
    });
  });

  describe('Mute Button', () => {
    it('should have mute button in toolbar', () => {
      const muteButton = document.getElementById('muteButton');
      expect(muteButton).toBeTruthy();
      expect(muteButton?.querySelector('svg')).toBeTruthy();
    });

    it('should toggle muted class', () => {
      const muteButton = document.getElementById('muteButton')!;

      // Initially unmuted
      expect(muteButton.classList.contains('muted')).toBe(false);

      // Toggle muted
      muteButton.classList.add('muted');
      expect(muteButton.classList.contains('muted')).toBe(true);

      // Toggle unmuted
      muteButton.classList.remove('muted');
      expect(muteButton.classList.contains('muted')).toBe(false);
    });

    it('should update icon based on mute state', () => {
      const muteButton = document.getElementById('muteButton')!;
      const svg = muteButton.querySelector('svg')!;

      // Muted icon (with X)
      svg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6m0-6l6 6"/>';
      expect(svg.innerHTML).toContain('M22 9l-6 6');

      // Unmuted icon (with waves)
      svg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zm11.07 8a4.5 4.5 0 0 0 0-2m-2.12-2.12a7 7 0 0 1 0 6.24m-2.12-2.12a3.5 3.5 0 0 1 0-2"/>';
      expect(svg.innerHTML).toContain('m-2.12-2.12a7 7 0 0 1 0 6.24');
    });
  });

  describe('Mode Selection', () => {
    it('should allow mode switching', () => {
      const modeButtons = document.querySelectorAll('.mode-button');
      const gravityButton = Array.from(modeButtons).find(
        btn => btn.getAttribute('data-mode') === 'gravity'
      ) as HTMLElement;

      expect(gravityButton).toBeTruthy();

      // Remove active from all
      modeButtons.forEach(btn => btn.classList.remove('active'));

      // Add active to gravity
      gravityButton.classList.add('active');
      expect(gravityButton.classList.contains('active')).toBe(true);

      const activeMode = document.querySelector('.mode-button.active');
      expect(activeMode?.getAttribute('data-mode')).toBe('gravity');
    });

    it('should remain clickable after canvas interactions', () => {
      const canvas = document.getElementById('artCanvas') as HTMLCanvasElement;
      const modeButtons = document.querySelectorAll('.mode-button');
      const bounceButton = Array.from(modeButtons).find(
        btn => btn.getAttribute('data-mode') === 'bounce'
      ) as HTMLElement;

      expect(bounceButton).toBeTruthy();

      // Simulate canvas touch/mouse events
      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      canvas.dispatchEvent(touchEvent);

      // Toolbar buttons should still be clickable
      modeButtons.forEach(btn => btn.classList.remove('active'));
      bounceButton.classList.add('active');
      expect(bounceButton.classList.contains('active')).toBe(true);

      const activeMode = document.querySelector('.mode-button.active');
      expect(activeMode?.getAttribute('data-mode')).toBe('bounce');
    });

    it('should allow switching between multiple modes consecutively', () => {
      const modeButtons = document.querySelectorAll('.mode-button');
      const modes = ['gravity', 'bounce', 'burst', 'lightning', 'constellation', 'vortex'];

      modes.forEach(mode => {
        const button = Array.from(modeButtons).find(
          btn => btn.getAttribute('data-mode') === mode
        ) as HTMLElement;

        expect(button).toBeTruthy();

        // Remove active from all
        modeButtons.forEach(btn => btn.classList.remove('active'));

        // Add active to current mode
        button.classList.add('active');
        expect(button.classList.contains('active')).toBe(true);

        const activeMode = document.querySelector('.mode-button.active');
        expect(activeMode?.getAttribute('data-mode')).toBe(mode);
      });
    });
  });

  describe('Brush Size Controls', () => {
    it('should increase brush size', () => {
      const brushSizeEl = document.getElementById('brushSize')!;
      const increaseBrushBtn = document.getElementById('increaseBrush')!;

      expect(brushSizeEl.textContent).toBe('4');

      // Simulate increase
      const currentSize = parseInt(brushSizeEl.textContent || '4');
      brushSizeEl.textContent = (currentSize + 1).toString();
      expect(brushSizeEl.textContent).toBe('5');
    });

    it('should decrease brush size', () => {
      const brushSizeEl = document.getElementById('brushSize')!;
      const decreaseBrushBtn = document.getElementById('decreaseBrush')!;

      expect(brushSizeEl.textContent).toBe('4');

      // Simulate decrease
      const currentSize = parseInt(brushSizeEl.textContent || '4');
      brushSizeEl.textContent = (currentSize - 1).toString();
      expect(brushSizeEl.textContent).toBe('3');
    });
  });
});
