import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { config } from "../config";

// Only the functions this backend actually calls — not the full contract ABI.
export const tokenizeArtAbi = parseAbi([
  "function safeMint(address to, string uri) returns (uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
]);

const transport = http(config.rpcUrl);
const account = privateKeyToAccount(config.deployerPrivateKey);

export const publicClient = createPublicClient({ chain: sepolia, transport });
export const walletClient = createWalletClient({ account, chain: sepolia, transport });
