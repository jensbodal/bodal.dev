import { defineConfig } from 'vite';
import wasmPack from 'vite-plugin-wasm-pack';

export default defineConfig({
  base: './', // Use relative paths for iOS/standalone, web deployment copies to /digital-bloom/
  plugins: [
    wasmPack('./crates/digital-bloom-wasm'),
  ],
  publicDir: 'public',
});
