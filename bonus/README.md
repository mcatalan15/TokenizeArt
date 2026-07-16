# Bonus — mint website

A graphical interface for minting a `TokenizeArt` NFT, on top of the mandatory
part (which is unaffected — `code/`, `deployment/`, and `mint/` remain the
source of truth for the contract itself). Per the subject, this is only
evaluated once the mandatory part is judged perfect, and it doesn't change
anything about the deployed contract.

## What it does

A visitor enters (or connects a wallet to autofill) a Sepolia address and a
title, and clicks "Mint". The backend pins fresh metadata JSON to IPFS
(reusing the already-pinned "42" artwork — this isn't an image-upload/custom
art tool) and calls `safeMint` on the already-deployed contract, then returns
the new `tokenId` and transaction hash.

## Architecture

```
bonus/
├── frontend/   Vite + TypeScript + Tailwind — static SPA, no framework
├── backend/    Fastify + TypeScript — mints via viem, pins via Pinata
├── caddy/      Caddyfile + Dockerfile — builds the frontend, serves it,
│               and reverse-proxies /api/* to the backend
└── docker-compose.yml
```

- **Two containers, not three.** Caddy's build stage compiles the frontend
  and copies the static output straight into the Caddy image, so there's no
  separate long-running "frontend server" — Caddy is both the static host
  and the reverse proxy, same as it would be for any SPA in production.
- **Fastify + TypeScript backend**, not another `forge script`. Minting from
  a live website is a real request/response cycle with user input to
  validate (address, title) and JSON to return — a small HTTP framework is
  the right tool, unlike the mandatory part's one-off deploy/mint scripts.
- **viem**, not shelling out to `cast`/`forge` from the backend. The backend
  already needs a JS-side Ethereum client to build/sign/send the
  `safeMint` transaction and read back the `tokenId` from the receipt logs;
  spawning a Foundry subprocess for that would just add a shell-out and a
  parsing step for no benefit.
- **The deployer key signs every mint**, same as `make mint` in the
  mandatory part. `safeMint` is `onlyOwner` (see
  `documentation/architecture.md` for why) — the website does not change
  that. It lets a visitor choose the *recipient* address, not who's allowed
  to mint. This also means every website mint is paid for by the deployer's
  Sepolia test ETH, which is why the backend rate-limits `/api/mint` to 5
  requests/minute (see `bonus/backend/src/server.ts`) — a cheap guard
  against an anonymous visitor draining the deployer's test balance or
  spamming pins to Pinata.
- **No image upload.** "On-chain image/metadata storage" and "a beautiful
  NFT" are separate, unimplemented bonus items — this one is scoped to just
  "a website where you can mint your NFT with a graphical interface". Every
  mint from this site reuses the one artwork already pinned by `make upload`
  (`BONUS_IMAGE_CID` in `.env`); only the metadata JSON (name/title) is
  freshly pinned per mint.
- **Caddy over nginx.** Automatic HTTPS and a Caddyfile short enough to read
  in one glance, for the same "boring, standard, low-maintenance" reasoning
  the rest of the project follows — no certificates or extra config to hand-
  manage for what's a demo site.

## Running it

Needs the same `.env` as the mandatory part, plus two more variables (see
`.env.example`):

```sh
BONUS_PORT=8080                    # host port the site is exposed on
BONUS_IMAGE_CID=<CID from `make upload`>
```

```sh
make bonus         # build + start (backend + caddy), prints the URL
make bonus-logs     # follow logs
make bonus-down     # stop
make clean-bonus    # stop + remove images/volumes
```

Then open `http://localhost:8080`.

## Security notes

- `safeMint` access control is unchanged — this site is a client of the
  contract's owner-only mint, not a bypass of it.
- `/api/mint` validates the recipient address (`viem.isAddress`) and rejects
  empty/oversized titles before touching IPFS or the chain.
- Rate-limited (5 req/min per IP) since every request costs the deployer
  real (test) gas and a Pinata pin.
- `DEPLOYER_PRIVATE_KEY` and `PINATA_JWT` reach the backend container only
  via `--env-file`/`env_file`, never baked into an image layer — same
  discipline as the mandatory part's containers.
- No CORS is configured on the backend: Caddy serves the frontend and proxies
  `/api/*` on the same origin, so the browser never needs cross-origin
  requests, and none are accepted from elsewhere.
