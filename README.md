# Cliff Clash / 崖邊一擊

Original-IP mobile H5. Cute original mascots knock each other off a cliff. Smash-like damage% and charged heavy. 1P vs CPU. ~3–15s rounds.

**Not affiliated with Chiikawa, Usagi, or any licensed character.** All fighters (Bun / Mochi / Bean) are original. Do not ship lookalikes.

Built with [Phaser 3](https://phaser.io/) (Arcade Physics) + Vite + TypeScript.

## Play

**Live:** https://wchklaus97.github.io/cliff-clash/

```bash
npm install
npm run dev
```

Open the local URL. Best at 390×694 (phone width). Keyboard: arrows/WASD, Space jump, J light, K heavy (hold to charge). Touch pad on mobile.

```bash
npm test
npm run build
npm run preview
```

## What this is / is not

- Is: 1P vs CPU cliff KO, Easy + Normal, share PNG
- Is not: Unity, Godot, online PVP, gacha, accounts, backend
- Is not: Zombie Runner, Three.js 9-view sprite pipeline, or anything in the `plase` recovery tree

## Game-dev steps (how this was built)

Do these in order. Grey-box physics is the game; art comes last.

1. **Scaffold** — Vite + TS + Phaser 3, `pixelArt: true`, Scale FIT 390×694, scenes Boot → Title → Select → Fight → Result.
2. **Combat math** — Pure functions for `% × weight × charge` knockback and `isOffCliff`. Unit-test without Phaser.
3. **Grey-box fight** — Short static platform, two Arcade bodies, J/K/Space, fall off = KO. 32×32 generated placeholders OK.
4. **Tune knockback** — Heavier fighter (Mochi) harder to launch; Bean dies earlier. Charged heavy must feel like the swing.
5. **CPU** — Easy (slow, light only) and Normal (approach, mix charge, stay on platform).
6. **Mobile pad** — On-screen move / jump / light / heavy that works at phone width.
7. **Share card** — Result PNG + Web Share; Cantonese taunt including `唔打到你飛落山就唔叫{winner}`.
8. **Select + palettes** — Three original fighters, ≤2 taps Title → Fight.
9. **README + GitHub** — IP disclaimer, Phaser credit, these steps, then push a **standalone** repo.

## Fighters

| Id | Name | Role |
| --- | --- | --- |
| bun | Bun / 包子 | balanced |
| mochi | Mochi / 糯米 | heavy |
| bean | Bean / 豆豆 | fast / frail |

## License

Game code is public on GitHub. Phaser is used under its own license (MIT). Original characters and names in this repo are original fiction.
