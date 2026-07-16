# Verifying Ownership

Once a token is minted, ownership is public on-chain and can be checked by
anyone — no special access needed — via the ERC-721 `ownerOf` function.

## Using `cast` (no local setup beyond Docker)

```sh
docker run --rm tokenizeart cast call <CONTRACT_ADDRESS> "ownerOf(uint256)(address)" <TOKEN_ID> --rpc-url <SEPOLIA_RPC_URL>
```

- `<CONTRACT_ADDRESS>`: the deployed `TokenizeArt` address (recorded in the
  root `README.md` once deployed).
- `<TOKEN_ID>`: the token to check, e.g. `0` for the first mint.
- `<SEPOLIA_RPC_URL>`: any Sepolia RPC endpoint (the same one used for
  `make deploy` / `make mint` works).

Expected output: the wallet address that received the mint.

## Using a block explorer

Sepolia Etherscan lets you call `ownerOf` from the "Read Contract" tab on the
verified contract's page without any tooling at all — paste the contract
address into the search bar, go to Contract → Read Contract, and query
`ownerOf` with the token id.

## Confirming the full token, not just ownership

To also see the metadata and image a token resolves to:

```sh
docker run --rm tokenizeart cast call <CONTRACT_ADDRESS> "tokenURI(uint256)(string)" <TOKEN_ID> --rpc-url <SEPOLIA_RPC_URL>
```

This returns the `ipfs://...` URI; fetch it through any public IPFS gateway
(e.g. `https://ipfs.io/ipfs/<CID>`) to see the metadata JSON and, following
its `image` field, the artwork itself.
