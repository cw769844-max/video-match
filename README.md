# Yu-Gi-Oh Progression Dueling App

A self-hosted, two-player Yu-Gi-Oh dueling web app built for running a
progression series (opening one set at a time, building a deck from what's
been pulled, and dueling) in the style of cimoooooooo's progression series.

## Architecture

```
video-match/
├── client/    # React + Vite + TypeScript frontend
├── server/    # Node.js + Express + Socket.io + Prisma (SQLite) backend
└── shared/    # TypeScript types shared between client and server
```

### Core concepts

- **Campaign**: a D&D-campaign-style container created by a host, joined by
  one invited player via a shareable invite code. Each campaign has its own
  master rule, banlist, forbidden-card toggle, turn timer setting, Bo1/Bo3
  default, and independent card collections/binders/match history. A player
  account can belong to many campaigns at once, each progressing
  independently.
- **Set progression**: the host enables a pool of set categories (Core
  Booster, Side Sets, Structure Decks, etc.) for the campaign; sets in that
  pool are ordered chronologically and unlocked **one at a time**, advanced
  manually by the host as the campaign progresses.
- **Pack opener**: YGOPRODeck-style — pick a currently-unlocked set and a
  number of packs to open; pulled cards are added to the opening player's
  campaign collection.
- **Collections & binders**: each player's owned cards within a campaign can
  be organized into any number of binders, created/renamed/deleted freely.
- **Dueling**: real-time Bo1/Bo3 matches with rock-paper-scissors for
  turn-order choice, a scriptable rules/chain/effect resolution engine
  (in progress), and support for any historical Master Rule and banlist.

## Getting started

Requires Node.js 20+.

```bash
npm install

# Server: copy env, run migrations + seed, start dev server
cp server/.env.example server/.env
npm run db:migrate
npm run db:seed
npm run dev:server

# Client (separate terminal): copy env, start dev server
cp client/.env.example client/.env
npm run dev:client
```

The client dev server runs on `http://localhost:5173`, the API on
`http://localhost:4000`.

## Status

Foundational scaffold: auth, campaign creation/invite/settings, and the
Prisma data model are in place. Card/set data ingestion, the pack opener,
binder UI, deck builder, and the real-time duel + chain-resolution engine
are in active development.
