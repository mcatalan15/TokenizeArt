import { config } from "../config";

// Same Pinata pinJSON call as mint/ipfs/upload.ts — duplicated rather than
// shared because the two live in separate npm projects (Foundry-container
// tooling vs. this backend) with no shared package to import from.
export async function pinMetadata(payload: unknown, name: string): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: payload }),
  });
  if (!res.ok) {
    throw new Error(`Pinata JSON upload failed: ${res.status} ${await res.text()}`);
  }
  const { IpfsHash } = (await res.json()) as { IpfsHash: string };
  return IpfsHash;
}
