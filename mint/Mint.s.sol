// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TokenizeArt} from "tokenizeart/TokenizeArt.sol";

/// @notice Mints one TokenizeArt token. Run via `make mint`, which reads
/// DEPLOYER_PRIVATE_KEY, NFT_CONTRACT_ADDRESS, and TOKEN_URI from `.env`
/// (TOKEN_URI is printed by `make upload`). MINT_RECIPIENT is optional and
/// defaults to the deployer/owner's own address.
contract Mint is Script {
    function run() external returns (uint256 tokenId) {
        uint256 ownerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address contractAddress = vm.envAddress("NFT_CONTRACT_ADDRESS");
        string memory uri = vm.envString("TOKEN_URI");
        address recipient = vm.envOr("MINT_RECIPIENT", vm.addr(ownerKey));

        TokenizeArt nft = TokenizeArt(contractAddress);

        vm.startBroadcast(ownerKey);
        tokenId = nft.safeMint(recipient, uri);
        vm.stopBroadcast();

        console.log("Minted tokenId:", tokenId);
        console.log("Recipient:", recipient);
    }
}
