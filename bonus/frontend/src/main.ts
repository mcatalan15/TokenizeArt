import "./style.css";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

interface MintResponse {
  error?: string;
  txHash: string;
  tokenId: string | null;
  tokenUri: string;
  imageGatewayUrl: string;
  metadataGatewayUrl: string;
  explorerUrl: string;
}

const addressInput = document.querySelector<HTMLInputElement>("#address")!;
const titleInput = document.querySelector<HTMLInputElement>("#title")!;
const connectBtn = document.querySelector<HTMLButtonElement>("#connect")!;
const mintBtn = document.querySelector<HTMLButtonElement>("#mint")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const resultEl = document.querySelector<HTMLDivElement>("#result")!;
const resultImage = document.querySelector<HTMLImageElement>("#result-image")!;
const resultTokenId = document.querySelector<HTMLSpanElement>("#result-tokenid")!;
const resultTx = document.querySelector<HTMLAnchorElement>("#result-tx")!;
const resultImageLink = document.querySelector<HTMLAnchorElement>("#result-image-link")!;
const resultMetadataLink = document.querySelector<HTMLAnchorElement>("#result-metadata-link")!;

connectBtn.addEventListener("click", async () => {
  if (!window.ethereum) {
    statusEl.textContent = "No browser wallet found — enter your address manually.";
    return;
  }
  try {
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    addressInput.value = accounts[0] ?? "";
    statusEl.textContent = "";
  } catch {
    statusEl.textContent = "Wallet connection was rejected.";
  }
});

mintBtn.addEventListener("click", async () => {
  const to = addressInput.value.trim();
  const title = titleInput.value.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
    statusEl.textContent = "Enter a valid Ethereum address.";
    return;
  }
  if (!title) {
    statusEl.textContent = "Enter a title for your NFT.";
    return;
  }

  mintBtn.disabled = true;
  statusEl.textContent = "Minting on Sepolia — this can take a few seconds...";
  resultEl.classList.add("hidden");

  try {
    const res = await fetch("/api/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, title }),
    });
    const data = (await res.json()) as MintResponse;

    if (!res.ok) {
      statusEl.textContent = data.error ?? "Mint failed.";
      return;
    }

    statusEl.textContent = "Minted!";
    resultImage.src = data.imageGatewayUrl;
    resultTokenId.textContent = data.tokenId ?? "?";
    resultTx.href = data.explorerUrl;
    resultImageLink.href = data.imageGatewayUrl;
    resultMetadataLink.href = data.metadataGatewayUrl;
    resultEl.classList.remove("hidden");
  } catch {
    statusEl.textContent = "Network error — is the backend running?";
  } finally {
    mintBtn.disabled = false;
  }
});
