# TokenizeArt

A Foundry-based ERC-721 implementation featuring IPFS-hosted 42-themed metadata,
deployed to the Sepolia testnet. Built for the 42 "Build your own NFT" project —
only the mandatory part is in scope; see [`subject.md`](./subject.md).

Full write-up of how it works and how to verify it: [`documentation/`](./documentation/README.md).

## Repository structure

```
code/            Foundry project: the ERC721 contract + its tests
deployment/      forge script that deploys the contract to Sepolia
mint/            forge script that mints a token + the IPFS upload tooling
documentation/   architecture, security notes, how to verify ownership
containers/      Dockerfile the whole toolchain runs in
Makefile         thin wrapper: make build / test / anvil / deploy / mint
```

## Technical choices

- **Solidity + Foundry.** Foundry gives fast Solidity-native tests
  (`forge test`), scripting, and deployment in one toolchain, without a
  separate JS test runner for the contract itself.
- **OpenZeppelin `ERC721URIStorage` + `Ownable`**, not hand-rolled token
  logic. Audited, standard implementations; the project only needed to add
  one restricted `safeMint` function on top. See
  [`documentation/architecture.md`](./documentation/architecture.md) for the
  full reasoning, including why `URIStorage` specifically and why minting is
  `onlyOwner`.
- **Ethereum / Sepolia testnet**, ERC-721 standard. Sepolia is a public,
  actively-maintained Ethereum testnet — no real funds are ever used.
- **IPFS for image + metadata**, off-chain, pinned via **Pinata**. Only the
  `ipfs://` URI is stored on-chain; on-chain image/metadata storage is a
  bonus-part feature and out of scope for the mandatory part. Pinata over a
  self-hosted node for the same reproducibility reason as Docker: no daemon
  the reviewer has to keep running to keep the files available.
- **Docker + Makefile.** The entire toolchain (Foundry + Node/TS) runs in a
  single container (`containers/Dockerfile`, `node:20-slim` base) so a
  reviewer reproduces results without installing anything locally. The
  Makefile is a thin wrapper around `docker build`/`docker run` — no logic
  lives in it.

## How to run it

```sh
make build   # build the Docker image
make test    # forge test -vvv
make anvil   # local Anvil node for fast iteration
make deploy  # deploy to Sepolia, prints the contract address (needs .env)
make upload  # pin the artwork + metadata to IPFS, prints the token URI
make mint    # mint the token with that URI (needs .env)
```

`deploy`, `upload`, and `mint` are separate steps because each prints a value
(contract address, then token URI) you copy into `.env` before running the
next one — see `.env.example` and
[`documentation/architecture.md`](./documentation/architecture.md#workflow-deploy--upload--mint).

## Deployment

- **Contract address:** `0x05C9A21ac7a6563cC00cEBfb192283D775d49d32`
- **Network:** Sepolia (chain id `11155111`)
- **Block explorer:** https://sepolia.etherscan.io/address/0x05C9A21ac7a6563cC00cEBfb192283D775d49d32
  (source verified — [contract code](https://sepolia.etherscan.io/address/0x05C9A21ac7a6563cC00cEBfb192283D775d49d32#code))
- **Token minted:** `tokenId 1`, owned by `0xd0Be4B40b5232852Af94F0d9B8D6d663ddDd590a`

> Note: `tokenId 0` was an earlier test mint made with the wrong local image
> file (an unrelated photo, not the "42" artwork) and does not represent
> the deliverable. `tokenURI` has no setter, so it can't be corrected after
> the fact — `tokenId 1` is the token to review.

Verify ownership yourself:

```sh
cast call 0x05C9A21ac7a6563cC00cEBfb192283D775d49d32 \
  "ownerOf(uint256)(address)" 1 \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

See [`documentation/ownership-verification.md`](./documentation/ownership-verification.md)
for the general form and how to inspect `tokenURI`/metadata as well.

## Bonus: mint website

A graphical interface for minting against the deployed contract lives in
[`bonus/`](./bonus/README.md) — Fastify + TypeScript backend, Vite +
TypeScript + Tailwind frontend, served behind Caddy, all via
`docker compose`. Run with `make bonus`. Per the subject, this is only
in scope for evaluation once the mandatory part above is judged perfect; it
does not change the deployed contract or its access control.
