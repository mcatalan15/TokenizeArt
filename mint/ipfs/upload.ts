// Uploads the NFT artwork and its metadata JSON to IPFS via Pinata.
// Run via `make upload` (needs PINATA_JWT in .env). Prints the resulting
// TOKEN_URI to paste into .env before running `make mint`.

import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  console.error("Missing PINATA_JWT in environment (.env).");
  process.exit(1);
}

const ARTIST_LOGIN = process.env.ARTIST_LOGIN ?? "mcatalan";
const NFT_TITLE = process.env.NFT_TITLE ?? "s42t";
const NFT_DESCRIPTION =
  process.env.NFT_DESCRIPTION ??
  "A TokenizeArt NFT minted for the 42 'Build your own NFT' project.";
const IMAGE_PATH = process.env.NFT_IMAGE_PATH ?? "mint/assets/artwork.svg";

async function pinFile(path: string): Promise<string> {
  const data = await readFile(path);
  const form = new FormData();
  form.append("file", new Blob([data]), basename(path));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Pinata file upload failed: ${res.status} ${await res.text()}`);
  }

  const { IpfsHash } = (await res.json()) as { IpfsHash: string };
  return IpfsHash;
}

async function pinJSON(payload: unknown, name: string): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
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

async function main() {
  const imageCid = await pinFile(IMAGE_PATH);
  const imageUri = `ipfs://${imageCid}`;
  console.log("Image pinned:", imageUri);

  const metadata = {
    name: `42 - ${NFT_TITLE}`,
    description: NFT_DESCRIPTION,
    image: imageUri,
    artist: ARTIST_LOGIN,
    attributes: [{ trait_type: "Artist", value: ARTIST_LOGIN }],
  };

  const metadataCid = await pinJSON(metadata, `${NFT_TITLE}-metadata.json`);
  const metadataUri = `ipfs://${metadataCid}`;

  console.log("Metadata pinned:", metadataUri);
  console.log("\nSet this in .env before running `make mint`:");
  console.log(`TOKEN_URI=${metadataUri}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
