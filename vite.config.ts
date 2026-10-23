import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHeader } from '@ligant/bench-chrome';
import { HEADER } from './src/lib/chrome';
import { faqPanelHtml, jsonLdHtml } from './src/lib/seo';
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
function staticBlock(): Plugin {
    const ROOT = '<div id="root"></div>';
    return {
        name: 'ligant-static-block',
        transformIndexHtml(html: string) {
            if (!html.includes(ROOT))
                throw new Error('ligant-static-block: <div id="root"></div> not found in index.html');
            return html
                .replace(ROOT, `<div id="root"><div class="wrap"><header class="masthead">${renderHeader(HEADER)}</header>${faqPanelHtml()}</div></div>`)
                .replace('</head>', `  ${jsonLdHtml()}\n  </head>`);
        },
    };
}
export default defineConfig({
    plugins: [react(), emitLicense(), staticBlock()],
    base: './',
    build: { outDir: 'dist', assetsInlineLimit: 0 },
});
