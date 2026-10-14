import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
function emitLicense(): Plugin {
    return {
        name: 'emit-license',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'LICENSE',
                source: readFileSync(resolve(__dirname, 'LICENSE'), 'utf8'),
            });
        },
    };
}
export default defineConfig({
    plugins: [react(), emitLicense()],
    base: './',
    build: { outDir: 'dist', assetsInlineLimit: 0 },
});
