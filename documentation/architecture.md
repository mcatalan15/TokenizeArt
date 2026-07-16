# Architecture & Design Decisions

## Status

Done: the `TokenizeArt` contract (`code/src/TokenizeArt.sol`), its Foundry
test suite (`code/test/TokenizeArt.t.sol`), the deploy/mint scripts
(`deployment/Deploy.s.sol`, `mint/Mint.s.sol`), the IPFS upload tooling
(`mint/ipfs/upload.ts`), the Docker/Makefile toolchain, and the actual
Sepolia deployment + mint — see the root `README.md`'s Deployment section
for the contract address, network, and how to verify ownership.

## Contract design

`TokenizeArt` is `ERC721URIStorage` + `Ownable` from OpenZeppelin, with one
added function:

```solidity
function safeMint(address to, string calldata uri) external onlyOwner returns (uint256 tokenId)
```

Why this shape, and nothing more:

- **`ERC721URIStorage` over plain `ERC721`.** The subject only requires a
  handful of tokens, each with its own image and metadata. `URIStorage` lets
  each token carry an explicit, independently-set URI (`_setTokenURI`)
  instead of requiring a shared `baseURI` + predictable per-token file
  naming convention. Simpler to mint one-off tokens correctly.
- **`Ownable`, not a custom role system.** There is exactly one privileged
  action (minting) and exactly one privileged account (the deployer). A
  bespoke role/allowlist system would be unused complexity; `Ownable` is the
  standard, audited way to express "one account, one privilege."
- **`onlyOwner` on `safeMint`.** Unrestricted minting is the most common
  vulnerability class in NFT contracts submitted for this project — anyone
  could otherwise mint arbitrary tokens under the collection's name. This is
  the project's whole attack surface, so it gets the whole focus.
- **`_safeMint`, not `_mint`.** Reverts if `to` is a contract that doesn't
  implement `onERC721Received`, preventing tokens from getting silently
  stuck. Standard OpenZeppelin recommendation.
- **Auto-incrementing `tokenId` starting at 0**, no external input for it.
  Removes an entire class of bugs (id collisions, gaps, attacker-chosen ids)
  for no cost, since nothing in the subject requires caller-chosen ids.
- **No max supply, pausability, royalties, or burn function.** None of these
  are required by the mandatory part, and CLAUDE.md is explicit about not
  adding functionality beyond what's asked. Every extra public function is
  extra attack surface a reviewer has to reason about.
- **Pinned pragma (`0.8.24`), not floating (`^0.8.24`).** A deployed
  contract's bytecode should be reproducible from source with one exact
  compiler version; a floating pragma leaves that ambiguous.

## Off-chain metadata (IPFS)

Only `tokenURI` (an `ipfs://` URI) is stored on-chain. It points to a JSON
metadata document, which itself points to the image — the standard ERC-721
off-chain metadata pattern, and the only IPFS-related option the mandatory
part asks for (on-chain image storage is explicitly a *bonus*, out of scope
here).

Metadata JSON shape produced by `mint/ipfs/upload.ts` (run via `make upload`):

```json
{
  "name": "42 - <title>",
  "description": "<short description>",
  "image": "ipfs://<image-CID>",
  "artist": "<42 login>",
  "attributes": [
    { "trait_type": "Artist", "value": "<42 login>" }
  ]
}
```

- `name` includes "42" and a title, per the subject's explicit requirement.
- `artist` is a top-level field carrying the 42 login directly, since the
  subject requires it explicitly; it's duplicated into `attributes` as well
  since that's the field most NFT marketplaces (e.g. OpenSea) render.
- `image` is itself an `ipfs://` URI, keeping the image on distributed
  storage rather than a centralized host.

## The artwork

`mint/assets/artwork.svg` is a static SVG: a dark card with a large "42"
centered on it. SVG rather than a rasterized format because it's natively
supported as an NFT image by IPFS gateways and by marketplaces (e.g.
OpenSea renders SVG directly), and it's trivial to author precisely and
losslessly by hand — no image-generation tooling or dependencies needed.
This is deliberately a single, simple, hand-authored image: the "beautiful
NFT" / generative-art system is a bonus-part feature and out of scope here.

## Workflow: deploy → upload → mint

Three separate steps, each its own `make` target, because each produces a
value the next one needs — there's no orchestration script tying them
together beyond that (not required, would just be extra surface):

1. **`make deploy`** runs `deployment/Deploy.s.sol`, which deploys
   `TokenizeArt` with the deployer as owner. Copy the printed address into
   `.env` as `NFT_CONTRACT_ADDRESS`.
2. **`make upload`** runs `mint/ipfs/upload.ts`, which pins
   `mint/assets/artwork.svg` and the metadata JSON (built from
   `ARTIST_LOGIN`/`NFT_TITLE` in `.env`) to IPFS via Pinata. Copy the
   printed `ipfs://` metadata URI into `.env` as `TOKEN_URI`.
3. **`make mint`** runs `mint/Mint.s.sol`, which calls `safeMint` on the
   deployed contract with that `TOKEN_URI`.

Pinata was chosen over running a local IPFS node for the same reason as the
rest of the toolchain: reliability and reproducibility for the reviewer — no
long-lived local daemon to keep pinning the files after the demo.

## Security notes for the reviewer

- Minting access control: covered by `test_RevertWhen_NonOwnerMints`.
- Zero-address mint rejected by OpenZeppelin's `_safeMint`, covered by
  `test_RevertWhen_MintingToZeroAddress`.
- No `tx.origin` usage anywhere in the contract.
- No reentrancy surface: `safeMint` makes exactly one external call
  (`onERC721Received`, if `to` is a contract) and it happens after all state
  writes complete inside OpenZeppelin's `_safeMint`/`_update`, so there's
  nothing left to reenter into.
- No secrets or private keys anywhere in `code/`, `deployment/`, or `mint/`
  — those are read from environment variables at runtime (see
  `.env.example`), never hardcoded or committed.
