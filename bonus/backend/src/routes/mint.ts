import type { FastifyInstance } from "fastify";
import { isAddress } from "viem";
import { config } from "../config";
import { pinMetadata } from "../lib/ipfs";
import { publicClient, walletClient, tokenizeArtAbi } from "../lib/chain";

interface MintBody {
  to?: string;
  title?: string;
}

export async function mintRoutes(app: FastifyInstance) {
  app.post<{ Body: MintBody }>("/api/mint", async (request, reply) => {
    const { to, title } = request.body ?? {};

    if (!to || !isAddress(to)) {
      return reply.code(400).send({ error: "Invalid recipient address." });
    }
    const cleanTitle = (title ?? "").trim().slice(0, 60);
    if (!cleanTitle) {
      return reply.code(400).send({ error: "Title is required." });
    }

    const imageUri = `ipfs://${config.imageCid}`;
    const metadata = {
      name: `42 - ${cleanTitle}`,
      description: "A TokenizeArt NFT minted for the 42 'Build your own NFT' project.",
      image: imageUri,
      artist: config.artistLogin,
      attributes: [{ trait_type: "Artist", value: config.artistLogin }],
    };

    const metadataCid = await pinMetadata(metadata, `${cleanTitle}-metadata.json`);
    const tokenUri = `ipfs://${metadataCid}`;

    const hash = await walletClient.writeContract({
      address: config.contractAddress,
      abi: tokenizeArtAbi,
      functionName: "safeMint",
      args: [to, tokenUri],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    // — tokenId is the 4th indexed topic (index 3), emitted by _safeMint.
    const transferLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === config.contractAddress.toLowerCase(),
    );
    const tokenId = transferLog?.topics[3] ? BigInt(transferLog.topics[3]).toString() : null;

    return reply.send({
      txHash: hash,
      tokenId,
      tokenUri,
      imageGatewayUrl: `https://gateway.pinata.cloud/ipfs/${config.imageCid}`,
      metadataGatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
      explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
    });
  });

  app.get<{ Params: { id: string } }>("/api/tokens/:id", async (request, reply) => {
    const tokenId = BigInt(request.params.id);

    const [owner, uri] = await Promise.all([
      publicClient.readContract({
        address: config.contractAddress,
        abi: tokenizeArtAbi,
        functionName: "ownerOf",
        args: [tokenId],
      }),
      publicClient.readContract({
        address: config.contractAddress,
        abi: tokenizeArtAbi,
        functionName: "tokenURI",
        args: [tokenId],
      }),
    ]);

    return reply.send({ tokenId: request.params.id, owner, tokenUri: uri });
  });
}
