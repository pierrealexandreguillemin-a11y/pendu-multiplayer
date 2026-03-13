'use client';

import { useEffect } from 'react';

const ASCII_BANNER = [
  '  ██████╗         █████╗    ██████╗',
  '  ██╔══██╗       ██╔══██╗   ██╔════╝',
  '  ██████╔╝       ███████║   ██║  ███╗',
  '  ██╔═══╝ █████╗ ██╔══██║   ██║   ██║',
  '  ██║     ╚════╝ ██║  ██║ ▄ ╚██████╔╝',
  '  ╚═╝            ╚═╝  ╚═╝ ▀  ╚═════╝',
].join('\n');

const REPO_URL = 'github.com/pierrealexandreguillemin-a11y/pendu-multiplayer';

export function ConsoleBanner() {
  useEffect(() => {
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--chart-1').trim() ||
      'oklch(0.646 0.222 41.116)';

    console.log(`%c\n${ASCII_BANNER}\n`, `color:${accent};font-family:monospace;`);
    console.log(
      '%c Pendu Multijoueur — par P-A.G ',
      `background:${accent};color:oklch(0.95 0 0);padding:6px 12px;border-radius:4px;font-weight:bold;font-family:monospace;`
    );
    console.log(
      `%c Curieux ? Le code est open-source → ${REPO_URL} `,
      'color:oklch(0.65 0.15 250);font-size:11px;'
    );
  }, []);

  return null;
}
