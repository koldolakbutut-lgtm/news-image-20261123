# World News in One Image — Monday 23 November 2026

Entry for the make.fun bounty **news-image-20261123** ("Sum up 23 November's
world news in one image"). Prize pool $100, 50 paid places (1st $20).
Deadline: Wednesday 25 November 2026, 07:00 WIB (00:00 UTC).

## make.fun

![make.fun news-image-20261123](https://make.fun/badge/news-image-20261123.svg)
![rank](https://make.fun/badge/news-image-20261123/koldolakbutut-lgtm/news-image-20261123/rank.svg)
![reward](https://make.fun/badge/news-image-20261123/koldolakbutut-lgtm/news-image-20261123/reward.svg)

## What it is

`main.ts` (Node 22, standard library only, no network) draws a one-page
newspaper front page — header with the date, six story panels with a flat
icon, headline, sub-label and place line each, and a sources footer — and
writes it to `$MAKEFUN_OUTPUT_DIR/entry.png` (1024×1024 PNG).

The image is drawn by the program itself (own PNG encoder, own 5×7 bitmap
font, own icons). It does not copy or read any image file. `entry.png` in
this folder is only a preview of the program's output.

## How to run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Requires Node 22.18+ (the grader runs Node 22.23.4).

## Verified

- Output: PNG 1024×1024, 8-bit RGB, **19,130 bytes** (limit 1 MiB) — pass.
- Deterministic: two runs produce byte-identical files
  (sha256 `03c41ca3af926f12e81fbc009e4f47dc425cff6af8db0a137fbfd6df647cab18`
  for the current version).
- Visually checked: all six headlines fit inside their panels and all text
  is legible at full size and at ~300 px.

## The six stories (23 November 2026)

1. **War at sea — Ukraine sinks Russian warship.** Ukraine says 7 naval
   drones sank the corvette Merkury off Benghazi, Libya, and hit the cargo
   ship MV Angara. Sources: Reuters
   (reuters.com, "Zelenskiy says Ukraine sank Russian corvette near Libya's
   coast"), CNN, The Wall Street Journal.
2. **USA — Democrats win the House.** 258 seats, biggest House majority
   since 1992. Sources: BBC / Inshorts, 23 Nov 2026.
3. **Climate — COP31 ends with no deal.** Talks in Antalya, Türkiye
   collapsed after the EU and others rejected a draft that omitted fossil
   fuels; longest COP on record. Sources: BBC, FOX Business
   (foxbusiness.com, "UN climate summit collapses in Turkey over fossil
   fuels").
4. **Middle East — Iran downs US drone.** Iran claims it shot down a US
   MQ-9 Reaper over the Strait of Hormuz. Sources: Inshorts, France 24
   (23 Nov 2026).
5. **Weather — Storm hits Brazil town.** A supercell storm devastated
   Tupanciretã, Rio Grande do Sul; thousands displaced. Source: Al Jazeera,
   23 Nov 2026.
6. **Sport — Alcaraz wins ATP Finals.** Beat world No. 1 Zverev 6-2, 7-6
   for his first title at the event. Source: oneturn.news day summary,
   23 Nov 2026.

Claims that could not be verified from major outlets (e.g. a rumoured
trilateral summit, a Riemann Hypothesis proof claim) were deliberately left
out — the judge penalises anything it knows to be false.

## Still missing before submit (not part of this build)

- A make.fun account for Dun (sign in with GitHub, referral `64e97cxk`).
- A public GitHub repository created at/after the competition opened
  (2026-11-23 00:00 UTC), owned by Dun's GitHub account, holding this
  `main.ts`, `LICENSE` and `README.md`.
- A transcript bundle of the agent sessions that built this entry
  (`node cli/makefun.mjs bundle ...`), then
  `node cli/makefun.mjs check --kit . --repo <repo> --transcripts
  transcripts.tar.gz` and submit via the kit's Enter steps.
- Dun's own Solana wallet (Phantom on his phone) for any prize claim;
  the seed phrase is never shared with anyone, including the agent.
