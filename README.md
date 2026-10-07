# portal-apple-music-firefox

A userscript that makes the Apple Music web player (music.apple.com) usable in Firefox on a Meta Portal+ Gen 1.

The Portal+ has a 15.6-inch screen that can rotate. This layout is tuned for portrait orientation; the stock web player doesn't fit it well. The script only changes styling:

- Hides the 'Install Apple Music' / 'Open in Music' block, the country picker bar, the sign-up banner and Google Play badge links.
- Turns the mini player into a full-width bar along the bottom, so the play and skip buttons stay on screen.
- Shows now-playing as a half-screen sheet, with smaller lyrics that scroll correctly.

## Install

1. In Firefox, install a userscript manager such as Tampermonkey or Violentmonkey.
2. Open `apple-music-portal.user.js` in this repo, click 'Raw', and let the manager install it.
3. Load https://music.apple.com/ and sign in.

## Notes

- Styling only. The script makes no network requests and doesn't touch your account.
- Tuned for a 540 x 870 CSS-pixel viewport (portrait orientation at 200% zoom). Other viewport sizes or orientations may look off.
- It relies on Apple's `data-testid` attributes. If Apple renames them, parts of the page will revert; update the selectors at the top of the script.
