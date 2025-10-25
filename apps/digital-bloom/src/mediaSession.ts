import { MediaSession, type MetadataOptions, type ActionHandler } from '@jofr/capacitor-media-session';

/**
 * MediaSession integration for iOS media controls
 * This module wraps the Capacitor MediaSession plugin to provide
 * custom media metadata and controls instead of showing "localhost"
 */

// Re-export MetadataOptions for external use
export type { MetadataOptions };

// Type for MediaSession playback states (standard Web API)
export type MediaSessionPlaybackState = 'none' | 'paused' | 'playing';

// Type for MediaSession actions (standard Web API)
export type MediaSessionAction = 'play' | 'pause' | 'seekbackward' | 'seekforward' | 'previoustrack' | 'nexttrack' | 'skipad' | 'stop' | 'seekto' | 'togglemicrophone' | 'togglecamera' | 'hangup';

export class DigitalBloomMediaSession {
    private isInitialized = false;
    private currentPlaybackState: MediaSessionPlaybackState = 'none';

    /**
     * Initialize the media session with default metadata
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Set default metadata for Digital Bloom
            await this.setMetadata({
                title: 'Digital Bloom',
                artist: 'Interactive Generative Art',
                album: 'Ambient Soundscape',
                artwork: [
                    {
                        src: '/icon.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            });

            // Set up action handlers for media controls
            await this.setupActionHandlers();

            this.isInitialized = true;
            console.log('[MediaSession] Initialized successfully');
        } catch (error) {
            console.error('[MediaSession] Failed to initialize:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Update media metadata
     */
    async setMetadata(metadata: MetadataOptions): Promise<void> {
        try {
            await MediaSession.setMetadata({
                title: metadata.title || 'Digital Bloom',
                artist: metadata.artist || 'Interactive Generative Art',
                album: metadata.album || 'Ambient Soundscape',
                artwork: metadata.artwork || []
            });
            console.log('[MediaSession] Metadata updated:', metadata);
        } catch (error) {
            console.error('[MediaSession] Failed to set metadata:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Set playback state (playing, paused, or none)
     * This controls whether the media notification is shown
     */
    async setPlaybackState(state: MediaSessionPlaybackState): Promise<void> {
        if (this.currentPlaybackState === state) {
            return; // No change needed
        }

        try {
            await MediaSession.setPlaybackState({
                playbackState: state
            });
            this.currentPlaybackState = state;
            console.log('[MediaSession] Playback state set to:', state);
        } catch (error) {
            console.error('[MediaSession] Failed to set playback state:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Set up action handlers for play/pause controls
     */
    private async setupActionHandlers(): Promise<void> {
        // Store the handlers to pass to the plugin
        // ActionHandler type from plugin: (details: ActionDetails) => void
        const playHandler: ActionHandler = (details) => {
            console.log('[MediaSession] Play action triggered', details);
            // Dispatch custom event that main.ts can listen to
            window.dispatchEvent(new CustomEvent('mediasession:play'));
        };

        const pauseHandler: ActionHandler = (details) => {
            console.log('[MediaSession] Pause action triggered', details);
            // Dispatch custom event that main.ts can listen to
            window.dispatchEvent(new CustomEvent('mediasession:pause'));
        };

        try {
            // Set play handler
            await MediaSession.setActionHandler(
                { action: 'play' },
                playHandler
            );

            // Set pause handler
            await MediaSession.setActionHandler(
                { action: 'pause' },
                pauseHandler
            );

            console.log('[MediaSession] Action handlers configured');
        } catch (error) {
            console.error('[MediaSession] Failed to set action handlers:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Update position state for scrubbing controls
     */
    async setPositionState(duration: number, position: number, playbackRate: number = 1.0): Promise<void> {
        try {
            await MediaSession.setPositionState({
                duration,
                position,
                playbackRate
            });
        } catch (error) {
            console.error('[MediaSession] Failed to set position state:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Start playback - shows media controls
     */
    async startPlayback(): Promise<void> {
        await this.setPlaybackState('playing');
    }

    /**
     * Pause playback - keeps controls visible
     */
    async pausePlayback(): Promise<void> {
        await this.setPlaybackState('paused');
    }

    /**
     * Stop playback - hides media controls
     */
    async stopPlayback(): Promise<void> {
        await this.setPlaybackState('none');
    }
}

// Singleton instance
export const mediaSession = new DigitalBloomMediaSession();
