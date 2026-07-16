// Fails fast on missing env vars instead of surfacing confusing runtime
// errors later, from the first request that touches the missing value.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  rpcUrl: required("SEPOLIA_RPC_URL"),
  deployerPrivateKey: required("DEPLOYER_PRIVATE_KEY") as `0x${string}`,
  contractAddress: required("NFT_CONTRACT_ADDRESS") as `0x${string}`,
  pinataJwt: required("PINATA_JWT"),
  artistLogin: process.env.ARTIST_LOGIN ?? "mcatalan",
  // Reuses the artwork already pinned by `make upload` — the website mints
  // new tokens of the same "42" artwork, it doesn't accept image uploads
  // (on-chain/custom image storage is a separate, unimplemented bonus item).
  imageCid: required("BONUS_IMAGE_CID"),
};
