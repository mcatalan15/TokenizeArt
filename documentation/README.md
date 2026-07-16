# Documentation

This folder explains how TokenizeArt works and how to use it. For *why* each
technical choice was made, see [`architecture.md`](./architecture.md). For
proving who owns the minted token, see
[`ownership-verification.md`](./ownership-verification.md).

## What this is

A single ERC-721 collection (`TokenizeArt`, symbol `T42`) deployed to the
Sepolia testnet. Each token's image and metadata live on IPFS; the contract
stores only the per-token IPFS URI on-chain (via OpenZeppelin's
`ERC721URIStorage`). Minting is restricted to the contract owner
(`onlyOwner`), which is the entire access-control surface of the project.

## Repository layout

```
code/            Foundry project: the ERC721 contract + its tests
deployment/      forge script that deploys the contract to Sepolia
mint/            forge script that mints a token + the IPFS upload tooling
documentation/   this folder
containers/      Dockerfile the whole toolchain runs in
Makefile         thin wrapper: make build / test / anvil / deploy / mint
```

## How to run it

Everything runs inside Docker — nobody needs Foundry or Node installed on the
host. Copy `.env.example` to `.env` and fill in the values before running
`deploy`, `upload`, or `mint`.

```sh
make build   # build the Docker image (Foundry + Node)
make test    # forge test -vvv, against code/test
make anvil   # local Anvil node, for fast iteration before touching Sepolia
make deploy  # deploy TokenizeArt to Sepolia, prints the contract address
make upload  # pin mint/assets/artwork.svg + metadata to IPFS, prints TOKEN_URI
make mint    # call safeMint with TOKEN_URI on the deployed contract
```

`deploy`, `upload`, and `mint` each print a value to copy into `.env` before
running the next one (`NFT_CONTRACT_ADDRESS`, then `TOKEN_URI`) — see
[`architecture.md`](./architecture.md#workflow-deploy--upload--mint) for the
full sequence, and the root `README.md` for the deployed contract address and
network once minted.
