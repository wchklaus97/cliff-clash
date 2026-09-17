# Cliff Clash / 崖邊一擊 — MVP Design

Date: 2026-09-17  
Status: Approved for implementation. Game is **not started**. Do not implement inside the `plase` repo.

## Product

Mobile-first pixel-art H5. Two original cute chibi mascots on a short cliff platform. Win by knocking the opponent off. Rounds ~3–15s. Smash-like damage% and charged heavy.

Separate from Zombie Runner, otome, card games, and any Chiikawa/Usagi IP.

## Stack

Vite + TypeScript + Phaser 3 Arcade Physics. `pixelArt: true`. Not Unity. Not Godot.

## Hard rules

- Original characters only. Do not use Chiikawa / Usagi / 烏薩奇 / 吉伊 names, art, or lookalike silhouettes.
- No online PVP, gacha, accounts, or backend.
- 1P vs CPU only.
- ≤2 taps from Title to Fight (Title Play → Select Fight).
- Scale FIT 390×694.
- Touch virtual pad + keyboard arrows/WASD + J light, K heavy, Space jump.

## Fighters

| Id | Role | Feel |
| --- | --- | --- |
| bun | balanced | mid speed, mid weight |
| mochi | heavy | slow, hard to launch, stronger hits |
| bean | fast/frail | fast, light, dies earlier |

32×32 generated pixel placeholders OK. Distinct palettes, not lookalike licensed mascots.

## Scenes

Boot → Title → Select → Fight → Result.

CPU Easy + Normal. Result share card (PNG + Web Share). Cantonese taunts including `唔打到你飛落山就唔叫{winner}`.

## Build order

1. Grey-box Phaser physics + cliff KO  
2. Knockback / % tuning  
3. CPU  
4. Mobile pad  
5. Share card  
6. Select + palettes  
7. README (IP disclaimer + Phaser credit + game-dev steps)

## Repo

New standalone git repo at `C:\Users\wchkl\Documents\game\game-dev\cliff-clash`.  
Do not nest it under `plase` or `outputs/batch-recovery`.

## Done

- `npm run dev` playable at phone width  
- `npm run build` OK  
- README has IP disclaimer, Phaser credit, and game-dev steps  
- Pushed to GitHub as its own repository  
