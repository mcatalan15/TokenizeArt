// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TokenizeArt} from "tokenizeart/TokenizeArt.sol";

/// @notice Deploys TokenizeArt. Run via `make deploy`, which supplies
/// --rpc-url/--broadcast and reads DEPLOYER_PRIVATE_KEY from `.env`.
/// The deployer becomes the contract owner (the only address allowed to mint).
contract Deploy is Script {
    function run() external returns (TokenizeArt nft) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        nft = new TokenizeArt(deployer);
        vm.stopBroadcast();

        console.log("TokenizeArt deployed at:", address(nft));
        console.log("Owner:", deployer);
    }
}
