// ==UserScript==
// @name         Apple Music web: declutter for Portal
// @namespace    local.portal.applemusic
// @version      1.0.1
// @description  Declutters music.apple.com on a Meta Portal (Android 9, Firefox): hides the install-app block, country picker and signup upsell; makes the compact player a full-width bar below the sidebar and content panes; turns the now-playing view into a half-screen sheet with smaller, correctly scrolled lyrics. Styling only; no network access.
// @match        https://music.apple.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Selectors are the page's own data-testid hooks, checked 2026-10-07 at a
  // 540 x 870 CSS-pixel viewport (the Portal at 200% zoom, portrait).
  // Apple can rename them; if something reverts, adjust here.

  const HIDE = [
    '[data-testid="native-cta"]',       // "Open in Music" / "Install Apple Music" + Google Play badge
    '[data-testid="banner-container"]', // "Choose another country..." bar
    '[data-testid="upsell-banner"]',    // "Explore 100 million songs..." signup bar
    'a[href*="play.google.com"]',       // stray Google Play badge links
  ];

  // The compact floating player lays its body out at ~516px inside a ~317px
  // container, so the play/skip buttons spill off the right edge of a narrow
  // screen. Make it a single full-width bar in its own strip along the bottom:
  // the sidebar and content panes (inside the fixed app-container) are shortened
  // by the bar's height so nothing sits underneath it.
  // Scoped to narrow viewports and to when the mini player exists.
  const PLAYER = `
@media (max-width: 800px) {
  :root { --pbar: 66px; }
  /* Firefox Android: 100vh (930) is taller than the visible viewport (870 = 100dvh),
     so Apple's app container hangs off the bottom of the screen. Size it from dvh,
     minus the bar's strip while the mini player exists. */
  html, body { height: 100dvh !important; }
  [data-testid="app-container"] { height: 100dvh !important; }
  html[data-pm-active] [data-testid="app-container"],
  [data-testid="app-container"]:has([data-testid="mini-player"]) {
    height: calc(100dvh - var(--pbar)) !important;
  }
  [data-testid="player-bar"].player-bar__floating-player {
    position: fixed !important; left: 0 !important; right: 0 !important;
    bottom: 0 !important; width: 100% !important; height: var(--pbar) !important;
    min-height: 0 !important; margin: 0 !important; padding: 0 !important;
    z-index: 10000 !important;
  }
  [data-testid="mini-player-container"] {
    width: 100% !important; height: var(--pbar) !important; margin: 0 !important;
    padding: 0 !important; box-sizing: border-box;
  }
  [data-testid="mini-player"] {
    width: 100% !important; min-width: 0 !important; height: var(--pbar) !important;
    box-sizing: border-box; padding: 0 14px !important; gap: 12px !important;
    flex-wrap: nowrap !important; align-items: center !important;
    border-radius: 16px 16px 0 0 !important;
    background: rgba(250, 250, 252, 0.97) !important;
    -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.2) !important;
  }
  [data-testid="mini-player-metadata"] {
    flex: 1 1 0 !important; min-width: 0 !important; height: auto !important;
  }
  [data-testid="mini-player-artwork"],
  [data-testid="mini-player-artwork"] .artwork-component {
    width: 46px !important; height: 46px !important;
  }
  [data-testid="mini-player-title"] {
    font-size: 16px !important; line-height: 20px !important; width: auto !important;
  }
  [data-testid="mini-player-subtitle"] {
    font-size: 13px !important; line-height: 17px !important; width: auto !important;
  }
  [data-testid="mini-player-controls"] {
    flex: 0 0 auto !important; gap: 22px !important; zoom: 1.4;
  }
  /* explicit colours: Apple draws the player text in the page theme, which is
     light-on-dark on some pages and would vanish on the light card */
  [data-testid="mini-player"], [data-testid="mini-player-title"] { color: #1d1d1f !important; }
  [data-testid="mini-player-subtitle"] { color: #6e6e73 !important; }
  [data-testid="mini-player-controls"],
  [data-testid="mini-player-controls"] * { color: #1d1d1f !important; }
  [data-testid="mini-player-controls"] svg,
  [data-testid="mini-player-controls"] svg path { fill: currentColor !important; }
}
@media (max-width: 800px) and (prefers-color-scheme: dark) {
  [data-testid="mini-player"] { background: rgba(44, 44, 46, 0.97) !important; }
  [data-testid="mini-player"], [data-testid="mini-player-title"] { color: #f5f5f7 !important; }
  [data-testid="mini-player-subtitle"] { color: #aeaeb2 !important; }
  [data-testid="mini-player-controls"],
  [data-testid="mini-player-controls"] * { color: #f5f5f7 !important; }
}`;


  // Half-screen now-playing sheet. Apple's full-screen view is a modal <dialog> holding a
  // collapse arrow, a compact header (art + title), the lyrics, the controls and a toggle
  // row. Anchor it to the bottom at ~64% height; the page stays visible above it.
  const SHEET = `
@media (max-width: 800px) {
  :root { --sheet: 64dvh; }
  dialog[data-testid="dialog"]:has(.now-playing-structure) {
    inset: auto 0 0 0 !important; width: 100% !important; max-width: 100% !important;
    height: var(--sheet) !important; max-height: var(--sheet) !important; margin: 0 !important;
    border-radius: 22px 22px 0 0 !important; overflow: hidden !important;
    box-shadow: 0 -8px 34px rgba(0, 0, 0, 0.5) !important;
  }
  dialog[data-testid="dialog"]:has(.now-playing-structure) .sliding-modal,
  dialog[data-testid="dialog"]:has(.now-playing-structure) .sliding-modal-content {
    height: 100% !important; min-height: 0 !important;
  }
  dialog[data-testid="dialog"]:has(.now-playing-structure) .sliding-modal-collapse {
    height: 30px !important; min-height: 0 !important;
  }
  dialog[data-testid="dialog"]:has(.now-playing-structure) .sliding-modal-main {
    height: calc(100% - 30px) !important; min-height: 0 !important;
  }
  .now-playing-structure {
    display: flex !important; flex-direction: column !important;
    height: 100% !important; min-height: 0 !important;
  }
  .now-playing-structure .now-playing-main {
    flex: 1 1 0 !important; min-height: 0 !important; height: auto !important;
  }
  .now-playing-structure .mobile-lyrics { height: 100% !important; display: flex !important; flex-direction: column !important; }
  .now-playing-structure .mobile-lyrics amp-lyrics { flex: 1 1 0 !important; min-height: 0 !important; height: auto !important; }
  /* Lyric lines are 34px inside Apple's shadow DOM, which page CSS cannot reach; scale the whole component. */
  .now-playing-structure .mobile-lyrics amp-lyrics { zoom: 0.6 !important; }
  .now-playing-structure .now-playing-controls { flex: 0 0 auto !important; height: auto !important; }
  .now-playing-structure .now-playing-controls .volume { display: none !important; }
  .now-playing-structure .now-playing-toggle { flex: 0 0 auto !important; height: 44px !important; }
  /* No-lyrics layout: Apple sizes the large square artwork (~394px) from its own logic, which
     overflows the sheet. Scale it down with zoom and centre it with the track info below. */
  .now-playing-structure--artwork .playback-item--large {
    display: flex !important; flex-direction: column !important; align-items: center !important;
    justify-content: center !important; gap: 8px !important; height: 100% !important;
  }
  .now-playing-structure--artwork .playback-item--large .artwork-container {
    flex: 0 0 auto !important; width: 394px !important; height: 394px !important;
    zoom: 0.5 !important; margin: 0 !important;
  }
  .now-playing-structure--artwork .playback-item--large .metadata { width: calc(100% - 64px) !important; flex: 0 0 auto !important; }
}`;

  const css = HIDE.join(',\n') + ' { display: none !important; }\n' + PLAYER + SHEET;

  const style = document.createElement('style');
  style.id = 'portal-declutter';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  // Flag <html> while the mini player exists, so the pane-shortening rule does not depend on :has().
  let queued = false;
  const syncFlag = () => {
    queued = false;
    const on = !!document.querySelector('[data-testid="mini-player"]');
    if (on) document.documentElement.setAttribute('data-pm-active', '');
    else document.documentElement.removeAttribute('data-pm-active');
  };
  new MutationObserver(() => {
    if (!queued) { queued = true; requestAnimationFrame(syncFlag); }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Lyrics: once the now-playing view is resized, Apple's auto-scroll leaves the current line about
  // 240px above the visible window. Nudge the scroller so the current line sits near the top.
  const lyricsFix = () => {
    const vis = [...document.querySelectorAll('amp-lyrics')].filter((l) => l.getBoundingClientRect().height > 40);
    const lyr = vis.find((l) => l.getAttribute('data-testid') === 'mobile-lyrics') || vis[0];
    if (!lyr) return;
    const root = lyr.openOrClosedShadowRoot || lyr.shadowRoot;
    const ts = root && root.querySelector('amp-lyrics-display-time-synced');
    const tsr = ts && (ts.openOrClosedShadowRoot || ts.shadowRoot);
    const cur = tsr && tsr.querySelector('amp-lyrics-display-synced-line[is-current]');
    if (!cur) return;
    const hr = lyr.getBoundingClientRect();
    const err = cur.getBoundingClientRect().top - hr.top - hr.height * 0.12;
    if (Math.abs(err) < 6) return;
    const z = parseFloat(getComputedStyle(lyr).zoom) || 1;
    ts.scrollTop += err / z;               // visual px -> the scroller's own px
  };
  // Follow every display frame while a lyrics panel exists (short refrain lines change about once a
  // second); idle at a slow poll otherwise.
  let raf = 0;
  const loop = () => { lyricsFix(); raf = requestAnimationFrame(loop); };
  setInterval(() => {
    const has = !!document.querySelector('amp-lyrics');
    if (has && !raf) raf = requestAnimationFrame(loop);
    else if (!has && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, 500);
})();
