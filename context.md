# TokenizeArt — Project Context

This document is the human-readable reference for the project: what it is, what's
required, what we've decided, and where we are in the build. `CLAUDE.md` (repo root)
holds the working rules for Claude Code; this file holds the *why* and the *plan*, and
should be updated as decisions get made so it stays accurate — treat it as a living doc,
not a one-time snapshot.

---

## 1. What this is

A 42-school project ("Build your own NFT" / TokenizeArt): design, test, deploy, and mint
a single ERC-721 NFT on a public test chain, with an image that visibly contains the
number 42, metadata stored on IPFS, and full documentation of the choices made.

Full original subject: see `subject.md` at repo root. Summary of the mandatory
requirements we are held to:

- NFT image must visibly include **42**, nothing offensive.
- Image stored on **distributed storage (IPFS)**.
- Token follows **ERC-721**.
- Metadata: artist name = 42 login, NFT name includes "42" + a title.
- Repo layout: `code/`, `deployment/`, `mint/`, `documentation/` at root, plus root
  `README.md` explaining technical choices.
- Deploy to a **public test chain**, never mainnet/real funds.
- Must be able to prove ownership post-mint (e.g. `ownerOf`).
- Root README must record contract address + network used.
- Security (access control, no unnecessary attack surface) is part of the evaluation.
- Bonus part (NFT-minting website, on-chain metadata/image, generative art) is **only**
  assessed if the mandatory part is perfect — so it is explicitly out of scope for now.

## 2. Tech stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Smart contract | Solidity + OpenZeppelin (`ERC721`, `Ownable`) | Standard, audited base rather than hand-rolled token logic — lower risk, faster to review. |
| Toolchain | Foundry (forge/cast/anvil) | Fast Solidity-native build/test/script loop, no JS test harness needed for contract logic. |
| Off-chain scripting | Node.js + TypeScript | IPFS upload of image + metadata; optional convenience CLI for minting. |
| Target network | Sepolia testnet | Public, well-supported testnet with faucets and Etherscan verification. |
| IPFS pinning | _TBD — pick one of Pinata / web3.storage / nft.storage_ | Avoids running a local IPFS node; keeps the demo reproducible for grading. |
| Containerization | Docker, single image, `node:<lts>-slim` or `debian:slim` | Reviewer reproduces the exact dev environment without installing Foundry/Node locally. |
| Orchestration | `Makefile` wrapping Docker commands | One consistent entry point (`make build/test/deploy/mint`) regardless of host OS. |

Open decision to close before Phase 4: **which IPFS pinning provider**. Record the final
choice and reasoning here and in the root README once picked.

## 3. Repository structure (target)

```
.
├── README.md            # tech choices + reasoning; contract address + network
├── CLAUDE.md             # instructions for Claude Code (agent rules, not human narrative)
├── subject.md            # original 42 subject (reference, do not edit)
├── Makefile              # thin wrapper: build/test/deploy/mint, all run in Docker
├── code/                 # Solidity contract(s) + Foundry project (src, test, lib)
├── deployment/           # forge scripts / config used to deploy to Sepolia
├── mint/                 # forge scripts / TS script used to mint + IPFS upload tooling
├── documentation/        # this file, plus how-it-works / how-to-run / ownership proof
└── containers/           # Dockerfile(s), .dockerignore, entrypoint scripts
```

## 4. Contract design decisions

- **Single fixed NFT vs counter-based collection:** the subject only requires
  successfully minting one NFT, so default to the simpler fixed/one-off design unless a
  reason emerges to support multiple mints. _(Confirm here once Phase 2 locks this in.)_
- **Access control:** minting restricted to the contract owner (`Ownable`), since there's
  no requirement for public/permissionless minting and restricting it is the safer
  default for a graded demo.
- **Metadata delivery:** `tokenURI` points to an `ipfs://<CID>` JSON file (name, artist =
  42 login, description, image field also `ipfs://<CID>`).

## 5. Roadmap / phases

Status key: ☐ not started · ▶ in progress · ✅ done

- ☐ **Phase 0** — Repo scaffolding: folders, `.gitignore`, `.env.example`.
- ☐ **Phase 1** — Foundry project init (`code/`) + OpenZeppelin installed, `forge build` clean.
- ☐ **Phase 2** — Contract design: ERC721 + Ownable, mint function, decisions above locked in.
- ☐ **Phase 3** — Foundry tests written and green (`forge test -vvv`) before touching IPFS/deploy.
- ☐ **Phase 4** — NFT asset: image with "42", metadata JSON, pinned to IPFS.
- ☐ **Phase 5** — Deploy to Sepolia (`deployment/`), Etherscan-verified, address recorded.
- ☐ **Phase 6** — Mint (`mint/`), confirm via `ownerOf`.
- ☐ **Phase 7** — Documentation + root README finalized.
- ☐ **Phase 8** — Full pass against `subject.md` mandatory checklist before considering it done.

Update the checkboxes as phases complete, and add a short dated note below when a
non-trivial decision changes (e.g. swapping the IPFS provider, changing the mint
function signature) so the record of *why* survives past the conversation that produced it.

## 6. Decision log

_(Append entries here as they happen — date, decision, reasoning.)_

- 2026-07-14 — Locked tech stack: Node/TS + Solidity + Foundry, Sepolia testnet, Docker
  (node/debian slim) + Makefile as the only supported run path.