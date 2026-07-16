// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenizeArt
/// @notice Minimal ERC-721 collection for the 42 "Build your own NFT" project.
/// Each token's metadata (including the image) lives on IPFS; only the URI
/// pointing to it is stored on-chain, via OpenZeppelin's ERC721URIStorage.
contract TokenizeArt is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner) ERC721("TokenizeArt42", "T42") Ownable(initialOwner) {}

    /// @notice Mints the next token to `to` with metadata at `uri` (an IPFS URI).
    /// @dev Restricted to the contract owner: minting is the project's only
    /// privileged action, so this is the entire access-control surface.
    function safeMint(address to, string calldata uri) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
