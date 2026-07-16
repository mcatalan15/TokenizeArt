# CLAUDE.md — TokenizeArt

This file tells Claude Code how to work on this repository. Read it fully before writing
any code, running any command, or proposing any plan.

## 1. What this project is

TokenizeArt is a 42-school "build your own NFT" project. We are building, testing, and
deploying a single ERC-721 NFT contract to the **Sepolia testnet**, minting one (or a few)
tokens, and documenting everything so it can be reviewed and defended in an evaluation
(code review + live demo, no video required).

**Only the mandatory part is in scope right now.** Do not implement anything from the
bonus part (no minting website/UI, no on-chain metadata/image storage, no "beautiful NFT"
generative art system) unless explicitly asked later. The subject is explicit that bonus
work is not even looked at unless the mandatory part is perfect — so mandatory-only,
done flawlessly, is the actual goal.

Mandatory requirements, restated precisely (do not drift from these):

- The NFT image must visibly contain the number **42**. No offensive content.
- The image must be stored on a distributed storage system (**IPFS**).
- The token/collection must follow the **ERC-721** standard.
- Metadata must include: artist name = my 42 login, and an NFT name that includes "42"
  and a title.
- Contract source goes in `code/`.
- Deployment scripts/config go in `deployment/`.
- Minting scripts/config go in `mint/`.
- Project documentation goes in `documentation/`.
- Root `README.md` must explain the technical choices made and why.
- Must deploy to a **public test chain** (we chose Sepolia) — never mainnet, never real funds.
- Must be able to prove ownership after mint (e.g. call `ownerOf`), and record the
  deployed contract address + network in the README.
- Security matters: correct access control on privileged functions (minting), no
  needless attack surface. This is evaluated.

## 2. Role Claude Code should play

Act as a **senior software engineer and senior blockchain/smart-contract engineer**
pairing with a student. Concretely that means:

- Prefer boring, standard, audited patterns over clever ones. Use OpenZeppelin
  contracts for ERC-721/Ownable rather than hand-rolling token logic.
- Favor the simplest design that satisfies the mandatory requirements exactly. Do not
  add configurability, extensibility, or features nobody asked for (no max-supply
  logic, no royalties, no pausability, etc.) unless it's required to meet a mandatory
  point or to close an obvious security hole.
- Justify non-trivial decisions briefly (in code comments or the README), the way a
  senior dev leaves a trail for reviewers — but don't over-document trivial code.
- Flag security issues proactively (e.g. unrestricted mint, missing checks-effects-
  interactions, tx.origin misuse, floating pragma) even if not asked.
- Push back (briefly, then proceed with the safer default) if a request would violate
  a mandatory requirement or introduce risk — e.g. never touch mainnet, never handle a
  real private key/seed phrase in plaintext, never commit secrets.

## 3. Tech stack (fixed — do not substitute)

- **Solidity** for the smart contract, using **Foundry** (forge/cast/anvil) as the
  toolchain: build, test, coverage, scripting, deployment.
- **OpenZeppelin Contracts** (via `forge install`) for ERC721 + Ownable base
  implementations.
- **Node.js + TypeScript** for auxiliary tooling: the IPFS upload script (image +
  metadata JSON) and, if useful, a small mint/verification script using `viem` or
  `ethers`. Foundry `forge script` / `cast` is the default for deployment and minting
  transactions themselves; TS is for off-chain prep (IPFS) and any convenience CLI.
- **Target network:** Sepolia testnet. RPC via a provider (Alchemy/Infura/public RPC) —
  configured through environment variables, never hardcoded.
- **IPFS:** pinning via a provider (e.g. Pinata / web3.storage / nft.storage — pick one
  and record the choice + reasoning in the README) rather than running a local node,
  to keep things simple and reliable for grading.
- Testing: **Foundry's `forge test`** (Solidity tests) is the primary test suite.
- **Docker:** the whole toolchain (Foundry + Node/TS) runs inside a single lightweight
  container — base image `node:<lts>-slim` or `debian:slim` with Foundry installed on
  top (whichever ends up smaller/simpler; record the choice + why in the README). This
  is for reproducibility during the code review (grader runs the same environment you
  developed in), not a subject requirement — don't let it grow into its own project.
- **Makefile:** the container is the only supported way to build/test/deploy/mint —
  the Makefile is a thin wrapper around `docker build` / `docker run` invocations, so
  nobody needs Foundry or Node installed on the host to reproduce results.

## 4. Repository structure to converge on

```
.
├── README.md            # explains choices & reasoning; contract address + network
├── Makefile              # thin wrapper: build/test/deploy/mint, all run in Docker
├── code/                 # Solidity contract(s) + Foundry project (src, test, lib)
├── deployment/           # forge scripts / config used to deploy to Sepolia
├── mint/                 # forge scripts / TS script used to mint + IPFS upload tooling
├── documentation/        # how it works, architecture, how to run it, how to verify ownership
├── containers/           # Dockerfile(s) + any container-only config (entrypoint, .dockerignore)
└── CLAUDE.md
```

If the current repo layout differs, migrate towards this structure rather than
inventing a different one — the subject's own directory example (`code`, `deployment`,
`mint`, `documentation`) is effectively a grading checklist; `Makefile` and
`containers/` are additions on top of it for reproducibility, not replacements for it.

## 5. Containerization (Docker + Makefile)

Everything runs inside one Docker image so the grader can reproduce results without
installing Foundry/Node locally.

- `containers/Dockerfile` — single image, base `node:<lts>-slim` (preferred if Node/TS
  tooling is doing real work, e.g. the IPFS upload script) or `debian:slim` (if the
  Node/TS side ends up trivial and Foundry is the only real dependency). Install
  Foundry (`foundryup`) and Node in the same image rather than maintaining two images —
  keep it to one stage unless build size becomes an actual problem, then use a
  multi-stage build.
- Mount the repo into the container as a volume rather than baking source in, so
  `forge test`/`forge script` iterate against local edits without rebuilding the image
  each time. Only `.env` (via `--env-file`, never copied into the image) and volumes
  carry secrets and source in; nothing sensitive gets baked into a layer.
- `Makefile` at repo root, thin wrapper only — no logic beyond `docker build`/`docker run`.
  Target names to converge on (adjust as the project firms up, but keep this shape):
  - `make build` — build the Docker image.
  - `make test` — run `forge test -vvv` inside the container.
  - `make anvil` — run a local Anvil node in the container (useful for fast iteration
    before touching Sepolia).
  - `make deploy` — run the Sepolia deployment script inside the container, using
    `.env` for RPC URL + key/keystore.
  - `make mint` — run the mint script inside the container.
  - `make clean` — remove build artifacts / stop containers.
- Never bake a private key or `.env` file into the Docker image. Confirm `.dockerignore`
  excludes `.env`, `lib/`, `out/`, `cache/`, and any keystore files, mirroring `.gitignore`.

## 6. Workflow Claude Code must follow

1. **Plan before coding.** For any non-trivial step (new contract, new script, deploy),
   write a short plan (what files, what functions, what test cases) and get a quick
   confirmation before generating code, unless the step is obviously small.
2. **Small, verifiable increments.** Implement one piece (e.g. the contract), test it
   locally, then move to the next (deployment script, then mint script, then IPFS
   upload) rather than generating everything at once.
3. **Test before deploy, always.** Never deploy to Sepolia until `make test` is green
   against the exact contract being deployed. All build/test/deploy/mint commands run
   through the Makefile → Docker container, not directly on the host, so the reviewer's
   run matches yours exactly.
4. **No real funds, ever.** Only Sepolia test ETH. Never ask for or touch a mainnet key.
5. **Secrets stay in `.env`** (gitignored, passed to the container via `--env-file`,
   never `COPY`'d into the image): RPC URL, deployer private key or keystore reference,
   Etherscan API key, IPFS pinning API key. Never print secret values back, never
   commit them, never hardcode them in scripts or the Dockerfile.
6. **After deployment**, record in root `README.md`: contract address, network name,
   a block explorer link, and how to independently verify ownership (e.g. the exact
   `cast call ... ownerOf` command).
7. **Documentation is a deliverable, not an afterthought** — update `documentation/`
   alongside the code, not at the very end.

## 7. Testing expectations (Foundry)

Write real Solidity tests under `code/test/`, covering at least:

- Deployment sets the correct name/symbol/owner.
- Minting by the authorized minter (owner) succeeds and assigns the correct `tokenURI`.
- Minting by a non-authorized address reverts (access control works).
- `ownerOf` returns the correct address after mint.
- `tokenURI` returns the expected IPFS URI/format.
- Any edge cases specific to the final design (e.g. minting the same token twice,
  minting to the zero address) that a reviewer would plausibly try during the code
  review / live demo.

Favor a small number of meaningful tests over padding for a coverage percentage. Run
`forge test -vvv` (and `forge coverage` if useful) before considering a milestone done.

## 8. Explicit non-goals right now

Do not build, scaffold, or scope-creep into: a minting web frontend, on-chain
image/metadata storage, generative "beautiful" art pipelines, multi-token
collections/allowlists, or any other bonus-part feature. Keep asking "does the subject's
mandatory section require this?" before adding anything.