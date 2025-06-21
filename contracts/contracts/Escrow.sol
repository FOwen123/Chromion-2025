// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v5.0.2/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v5.0.2/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v5.0.2/contracts/access/AccessControl.sol";

contract Escrow is CCIPReceiver, OwnerIsCreator, AccessControl {
    using SafeERC20 for IERC20;

    // Access Control Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");

    // Errors
    error InvalidLinkToken();
    error InvalidUsdcToken();
    error UnauthorizedSender(address sender);
    error UnauthorizedSourceChain(uint64 destinationChainSelector);

    error OrderNotFound(bytes32 orderId);
    error InvalidOrderStatus(
        bytes32 orderId,
        OrderStatus current,
        OrderStatus required
    );
    error OnlyBuyer(bytes32 orderId, address caller);
    error OnlySeller(bytes32 orderId, address caller);
    error OnlyBuyerOrSeller(bytes32 orderId, address caller);

    error InvalidAmount(uint256 amount);
    error TransferFailed();
    error InvalidFeePercent(uint256 feePercent);

    enum OrderStatus {
        Pending, // Funds locked, waiting for delivery confirmation
        Delivered, // Buyer confirmed delivery, funds can be released to seller
        Disputed, // Buyer disputed the order
        Refunded, // Funds refunded to buyer
        Completed // Funds released to seller
    }

    struct Order {
        bytes32 orderId;
        address buyer;
        address seller;
        address token; // Token contract address (address(0) for native ETH)
        uint256 amount;
        OrderStatus status;
        uint256 createdAt;
        string deliveryInfo; // Optional delivery tracking info
    }

    // Mappings
    mapping(uint64 => bool) public allowlistedSourceChains; // Authorized Source Chains
    mapping(address => bool) public authorizedSenders; // Authorized CCIP sender contracts

    mapping(bytes32 => Order) public orders;
    mapping(address => bytes32[]) public buyerOrders;
    mapping(address => bytes32[]) public sellerOrders;

    // Configuration
    IERC20 private immutable i_linkToken;
    IERC20 private immutable i_usdcToken;

    uint256 public s_platformFeePercent = 250; // 2.5% platform fee (basis points)
    address public s_platformFeeRecipient;

    bytes32 public s_orderId; // messageId
    address public s_tokenAddress; // Store the last received token address
    uint256 public s_tokenAmount; // Store the last received token amount
    address public s_buyer; // Store the last received buyer address
    address public s_seller; // Store the last received seller address

    // Events
    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender, // The buyer
        address seller,
        address token,
        uint256 tokenAmount
    );

    event OrderCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount
    );

    event OrderDelivered(
        bytes32 indexed orderId,
        address indexed buyer,
        string deliveryInfo
    );

    event OrderDisputed(
        bytes32 indexed orderId,
        address indexed buyer,
        string reason
    );

    event OrderCompleted(
        bytes32 indexed orderId,
        address indexed seller,
        uint256 amount,
        uint256 platformFee
    );

    event OrderRefunded(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount
    );

    event DisputeResolvedForSeller(bytes32 indexed orderId, string aiReason);

    event DisputeResolvedForBuyer(bytes32 indexed orderId, string aiReason);

    event SenderAuthorized(address indexed sender, bool authorized);

    constructor(
        address _router,
        address _link,
        address _usdcToken,
        address _platformFeeRecipient
    ) CCIPReceiver(_router) {
        if (_link == address(0)) revert InvalidLinkToken();
        if (_usdcToken == address(0)) revert InvalidUsdcToken();

        i_linkToken = IERC20(_link);
        i_usdcToken = IERC20(_usdcToken);
        s_platformFeeRecipient = _platformFeeRecipient;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISPUTE_RESOLVER_ROLE, msg.sender);
    }

    // Override supportsInterface to handle multiple inheritance
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, CCIPReceiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender) {
        if (!allowlistedSourceChains[_sourceChainSelector]) {
            revert UnauthorizedSourceChain(_sourceChainSelector);
        }
        if (!authorizedSenders[_sender]) {
            revert UnauthorizedSender(_sender);
        }
        _;
    }

    modifier orderExists(bytes32 _orderId) {
        if (orders[_orderId].buyer == address(0)) {
            revert OrderNotFound(_orderId);
        }
        _;
    }

    modifier onlyBuyer(bytes32 _orderId) {
        if (orders[_orderId].buyer != msg.sender) {
            revert OnlyBuyer(_orderId, msg.sender);
        }
        _;
    }

    modifier onlySeller(bytes32 _orderId) {
        if (orders[_orderId].seller != msg.sender) {
            revert OnlySeller(_orderId, msg.sender);
        }
        _;
    }

    modifier onlyBuyerOrSeller(bytes32 _orderId) {
        if (
            orders[_orderId].buyer != msg.sender &&
            orders[_orderId].seller != msg.sender
        ) {
            revert OnlyBuyerOrSeller(_orderId, msg.sender);
        }
        _;
    }

    // Allowlist source chain
    function allowlistSource(
        uint64 _sourceChainSelector
    ) external onlyRole(ADMIN_ROLE) {
        allowlistedSourceChains[_sourceChainSelector] = true;
    }

    // Allowlist sender
    function allowlistSender(address _sender) external onlyRole(ADMIN_ROLE) {
        authorizedSenders[_sender] = true;
    }

    // Denylist source chain
    function denylistSource(
        uint64 _sourceChainSelector
    ) external onlyRole(ADMIN_ROLE) {
        allowlistedSourceChains[_sourceChainSelector] = false;
    }

    // Denylist sender
    function denylistSender(address _sender) external onlyRole(ADMIN_ROLE) {
        authorizedSenders[_sender] = false;
    }

    // Returns the details of the last CCIP received message
    function getLastReceivedMessageDetails()
        public
        view
        returns (
            bytes32 messageId,
            address buyer,
            address seller,
            address tokenAddress,
            uint256 tokenAmount
        )
    {
        return (
            s_orderId, 
            s_buyer, 
            s_seller, 
            s_tokenAddress, 
            s_tokenAmount
        );
    }

    // CCIP Receiver function - handles incoming cross-chain payments
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    )
        internal
        override
        onlyAllowlisted(
            message.sourceChainSelector,
            abi.decode(message.sender, (address))
        )
    {
        s_orderId = message.messageId;
        (s_buyer, s_seller) = abi.decode(message.data, (address, address));

        s_tokenAddress = message.destTokenAmounts[0].token;
        s_tokenAmount = message.destTokenAmounts[0].amount;

        emit MessageReceived(
            message.messageId,
            message.sourceChainSelector,
            abi.decode(message.sender, (address)), //
            s_seller,
            s_tokenAddress,
            s_tokenAmount
        );

        // Create new order
        Order memory newOrder = Order({
            orderId: s_orderId,
            buyer: s_buyer,
            seller: s_seller,
            token: s_tokenAddress,
            amount: s_tokenAmount,
            status: OrderStatus.Pending,
            createdAt: block.timestamp,
            deliveryInfo: "" // Empty, store in database
        });

        orders[s_orderId] = newOrder;
        buyerOrders[s_buyer].push(s_orderId);
        sellerOrders[s_seller].push(s_orderId);

        emit OrderCreated(
            s_orderId,
            s_buyer,
            s_seller,
            s_tokenAddress,
            s_tokenAmount
        );
    }

    // Buyer confirms delivery - automatically releases funds to seller
    function confirmDelivery(
        bytes32 _orderId,
        string calldata _deliveryInfo
    ) external orderExists(_orderId) onlyBuyer(_orderId) {
        Order storage order = orders[_orderId];
        if (order.status != OrderStatus.Pending) {
            revert InvalidOrderStatus(
                _orderId,
                order.status,
                OrderStatus.Pending
            );
        }

        order.status = OrderStatus.Completed;
        order.deliveryInfo = _deliveryInfo;

        // Calculate platform fee
        uint256 platformFee = (order.amount * s_platformFeePercent) / 10000;
        uint256 sellerAmount = order.amount - platformFee;

        // Transfer tokens immediately
        _transferTokens(order.seller, sellerAmount);
        if (platformFee > 0) {
            _transferTokens(s_platformFeeRecipient, platformFee);
        }

        emit OrderDelivered(_orderId, msg.sender, _deliveryInfo);
        emit OrderCompleted(_orderId, order.seller, sellerAmount, platformFee);
    }

    // Buyer requests refund - creates dispute for AI resolution
    function requestRefund(
        bytes32 _orderId,
        string calldata _reason
    ) external orderExists(_orderId) onlyBuyer(_orderId) {
        Order storage order = orders[_orderId];

        if (order.status != OrderStatus.Pending) {
            revert InvalidOrderStatus(
                _orderId,
                order.status,
                OrderStatus.Pending
            );
        }

        order.status = OrderStatus.Disputed;
        order.deliveryInfo = _reason; // Store refund reason

        emit OrderDisputed(_orderId, msg.sender, _reason);
    }

    // AI resolves dispute in favor of seller
    function resolveDisputeForSeller(
        bytes32 _orderId,
        string calldata _aiReason
    ) external onlyRole(DISPUTE_RESOLVER_ROLE) orderExists(_orderId) {
        Order storage order = orders[_orderId];

        if (order.status != OrderStatus.Disputed) {
            revert InvalidOrderStatus(
                _orderId,
                order.status,
                OrderStatus.Disputed
            );
        }

        order.status = OrderStatus.Completed;
        order.deliveryInfo = _aiReason; // Store AI resolution reason

        // Calculate platform fee
        uint256 platformFee = (order.amount * s_platformFeePercent) / 10000;
        uint256 sellerAmount = order.amount - platformFee;

        // Transfer tokens to seller
        _transferTokens(order.seller, sellerAmount);
        if (platformFee > 0) {
            _transferTokens(s_platformFeeRecipient, platformFee);
        }

        emit OrderCompleted(_orderId, order.seller, sellerAmount, platformFee);
        emit DisputeResolvedForSeller(_orderId, _aiReason);
    }

    // AI resolves dispute in favor of buyer (refund)
    function resolveDisputeForBuyer(
        bytes32 _orderId,
        string calldata _aiReason
    ) external onlyRole(DISPUTE_RESOLVER_ROLE) orderExists(_orderId) {
        Order storage order = orders[_orderId];

        if (order.status != OrderStatus.Disputed) {
            revert InvalidOrderStatus(
                _orderId,
                order.status,
                OrderStatus.Disputed
            );
        }

        order.status = OrderStatus.Refunded;
        order.deliveryInfo = _aiReason; // Store AI resolution reason

        // Refund full amount to buyer
        _transferTokens(order.buyer, order.amount);

        emit OrderRefunded(_orderId, order.buyer, order.amount);
        emit DisputeResolvedForBuyer(_orderId, _aiReason);
    }

    // Internal function to handle token transfers
    function _transferTokens(address _to, uint256 _amount) internal {
        i_usdcToken.safeTransfer(_to, _amount);
    }

    function setPlatformFee(uint256 _feePercent) external onlyRole(ADMIN_ROLE) {
        if (_feePercent > 1000) {
            // Max 10%
            revert InvalidFeePercent(_feePercent);
        }
        s_platformFeePercent = _feePercent;
    }

    function setPlatformFeeRecipient(
        address _recipient
    ) external onlyRole(ADMIN_ROLE) {
        s_platformFeeRecipient = _recipient;
    }

    // View functions
    function getOrder(bytes32 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }

    function getBuyerOrders(
        address _buyer
    ) external view returns (bytes32[] memory) {
        return buyerOrders[_buyer];
    }

    function getSellerOrders(
        address _seller
    ) external view returns (bytes32[] memory) {
        return sellerOrders[_seller];
    }

    function getOrderStatus(
        bytes32 _orderId
    ) external view returns (OrderStatus) {
        return orders[_orderId].status;
    }

    // Role Management Functions
    function grantDisputeResolverRole(
        address account
    ) external onlyRole(ADMIN_ROLE) {
        _grantRole(DISPUTE_RESOLVER_ROLE, account);
    }

    function revokeDisputeResolverRole(
        address account
    ) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DISPUTE_RESOLVER_ROLE, account);
    }

    // Emergency functions
    function emergencyWithdraw(uint256 _amount) external onlyRole(ADMIN_ROLE) {
        _transferTokens(msg.sender, _amount);
    }

    // Allow contract to receive native ETH
    receive() external payable {}
}
