// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NPC HOOD
/// @notice ERC-721 collection with capped supply and two native-currency mint routes.
/// @dev Deploy from the wallet intended to control contract proceeds; that wallet becomes owner.
contract NpcHood is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public constant MAX_PER_TX = 20;
    uint256 public constant FREE_MINT_FEE = 0.0001 ether;
    uint256 public constant PAID_MINT_PRICE = 0.0003 ether;

    uint256 public totalMinted;
    string private _collectionBaseURI;

    error InvalidQuantity();
    error TransactionLimitExceeded(uint256 requested, uint256 maximum);
    error SupplyExceeded(uint256 requested, uint256 remaining);
    error IncorrectPayment(uint256 expected, uint256 received);
    error NothingToWithdraw();
    error TransferFailed();
    error DirectPaymentDisabled();

    event NpcHoodMinted(address indexed minter, uint256 quantity, bool paid, uint256 amountPaid);
    event ProceedsWithdrawn(address indexed recipient, uint256 amount);
    event CollectionBaseURIChanged(string newBaseURI);

    constructor(string memory initialBaseURI)
        ERC721("NPC HOOD", "HOOD")
        Ownable(msg.sender)
    {
        _collectionBaseURI = initialBaseURI;
    }

    /// @notice Mint at the free route's per-NFT project fee of 0.0001 native currency.
    function freeMint(uint256 quantity) external payable nonReentrant {
        _mintFor(msg.sender, quantity, FREE_MINT_FEE, false);
    }

    /// @notice Mint at the paid route's price of 0.0003 native currency per NFT.
    function paidMint(uint256 quantity) external payable nonReentrant {
        _mintFor(msg.sender, quantity, PAID_MINT_PRICE, true);
    }

    /// @notice Withdraw the full collected balance to the current contract owner.
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();

        address recipient = owner();
        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit ProceedsWithdrawn(recipient, amount);
    }

    /// @notice Set a collection-wide token metadata URI prefix. Owner-controlled.
    function setCollectionBaseURI(string calldata newBaseURI) external onlyOwner {
        _collectionBaseURI = newBaseURI;
        emit CollectionBaseURIChanged(newBaseURI);
    }

    function _mintFor(address recipient, uint256 quantity, uint256 unitPrice, bool paid) private {
        if (quantity == 0) revert InvalidQuantity();
        if (quantity > MAX_PER_TX) revert TransactionLimitExceeded(quantity, MAX_PER_TX);
        uint256 remaining = MAX_SUPPLY - totalMinted;
        if (quantity > remaining) revert SupplyExceeded(quantity, remaining);

        uint256 expectedPayment = unitPrice * quantity;
        if (msg.value != expectedPayment) revert IncorrectPayment(expectedPayment, msg.value);

        // Update state before calling ERC-721 receiver hooks; any revert rolls back the whole tx.
        uint256 firstTokenId = totalMinted + 1;
        totalMinted += quantity;
        for (uint256 offset = 0; offset < quantity; offset++) {
            _safeMint(recipient, firstTokenId + offset);
        }

        emit NpcHoodMinted(recipient, quantity, paid, expectedPayment);
    }

    function _baseURI() internal view override returns (string memory) {
        return _collectionBaseURI;
    }

    receive() external payable {
        revert DirectPaymentDisabled();
    }

    fallback() external payable {
        revert DirectPaymentDisabled();
    }
}
