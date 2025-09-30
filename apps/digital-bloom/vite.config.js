import { defineConfig } from 'vite';
import wasmPack from 'vite-plugin-wasm-pack';

export default defineConfig({
  base: '/digital-bloom/',
  plugins: [
    wasmPack('./crates/digital-bloom-wasm'),
  ],
  publicDir: 'public',
});
