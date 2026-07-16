// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {TokenizeArt} from "../src/TokenizeArt.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TokenizeArtTest is Test {
    TokenizeArt private nft;

    address private owner = makeAddr("owner");
    address private collector = makeAddr("collector");
    address private stranger = makeAddr("stranger");

    string private constant TOKEN_URI = "ipfs://bafybeigdyrztokenuri/metadata.json";

    function setUp() public {
        nft = new TokenizeArt(owner);
    }

    function test_ConstructorSetsNameSymbolAndOwner() public view {
        assertEq(nft.name(), "TokenizeArt42");
        assertEq(nft.symbol(), "T42");
        assertEq(nft.owner(), owner);
    }

    function test_OwnerCanMint() public {
        vm.prank(owner);
        uint256 tokenId = nft.safeMint(collector, TOKEN_URI);

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(tokenId), collector);
        assertEq(nft.tokenURI(tokenId), TOKEN_URI);
    }

    function test_RevertWhen_NonOwnerMints() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        nft.safeMint(collector, TOKEN_URI);
    }

    function test_RevertWhen_MintingToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721InvalidReceiver.selector, address(0)));
        nft.safeMint(address(0), TOKEN_URI);
    }

    function test_SequentialMintsIncrementTokenId() public {
        vm.startPrank(owner);
        uint256 first = nft.safeMint(collector, TOKEN_URI);
        uint256 second = nft.safeMint(collector, TOKEN_URI);
        vm.stopPrank();

        assertEq(first, 0);
        assertEq(second, 1);
        assertEq(nft.ownerOf(first), collector);
        assertEq(nft.ownerOf(second), collector);
    }

    function test_RevertWhen_TokenURIQueriedForNonexistentToken() public {
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 0));
        nft.tokenURI(0);
    }
}
