// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v5.0.2/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v5.0.2/contracts/token/ERC20/utils/SafeERC20.sol";

contract Sender is OwnerIsCreator {
    using SafeERC20 for IERC20;

    error InvalidRouter();
    error InvalidLinkToken();
    error InvalidUsdcToken();
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error DestinationChainNotWhitelisted(uint64 destinationChainSelector);
    error NothingToWithdraw();
    error InsufficientTokenBalance(
        uint256 currentBalance,
        uint256 requiredAmount
    );
    error InvalidReceiverAddress();

    mapping(uint64 => bool) public whitelistedChains;

    IRouterClient private immutable i_router;
    IERC20 private immutable i_linkToken;
    IERC20 private immutable i_usdcToken;

    event TokensTransferred(
        bytes32 indexed messageId, // The unique ID of the message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        address token, // The token address that was transferred.
        uint256 tokenAmount, // The token amount that was transferred.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the message.
    );

    event PaymentProcessed(
        bytes32 indexed orderId, // MessageId
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount
    );

    modifier onlyWhitelistedChain(uint64 _destinationChainSelector) {
        if (!whitelistedChains[_destinationChainSelector])
            revert DestinationChainNotWhitelisted(_destinationChainSelector);
        _;
    }

    modifier validateReceiver(address _receiver) {
        if (_receiver == address(0)) revert InvalidReceiverAddress();
        _;
    }

    constructor(address _router, address _link, address _usdcToken) {
        if (_router == address(0)) revert InvalidRouter();
        if (_link == address(0)) revert InvalidLinkToken();
        if (_usdcToken == address(0)) revert InvalidUsdcToken();

        i_router = IRouterClient(_router);
        i_linkToken = IERC20(_link);
        i_usdcToken = IERC20(_usdcToken);
    }

    function whitelistChain(
        uint64 _destinationChainSelector
    ) external onlyOwner {
        whitelistedChains[_destinationChainSelector] = true;
    }

    function denylistChain(
        uint64 _destinationChainSelector
    ) external onlyOwner {
        whitelistedChains[_destinationChainSelector] = false;
    }

    function transferTokensPayLINK(
        uint64 _destinationChainSelector,
        address _receiver,
        uint256 _amount,
        address _seller
    )
        external
        onlyOwner
        onlyWhitelistedChain(_destinationChainSelector)
        validateReceiver(_receiver)
        returns (bytes32 messageId)
    {
        // Check buyer balance
        if (i_usdcToken.balanceOf(msg.sender) < _amount) {
            revert InsufficientTokenBalance(
                i_usdcToken.balanceOf(msg.sender),
                _amount
            );
        }

        Client.EVM2AnyMessage memory message = _buildCCIPMessage(
            _receiver,
            _amount,
            msg.sender,
            _seller
        );

        // CCIP Fees Management - buyer pays LINK fees
        uint256 fees = i_router.getFee(_destinationChainSelector, message);
        if (fees > i_linkToken.balanceOf(msg.sender)) {
            revert NotEnoughBalance(i_linkToken.balanceOf(msg.sender), fees);
        }

        // Approve and send
        i_linkToken.approve(address(i_router), fees);

        // Approve Router to spend tokens we send
        i_usdcToken.approve(address(i_router), _amount);

        // Send CCIP Message
        messageId = i_router.ccipSend(_destinationChainSelector, message);

        emit TokensTransferred(
            messageId,
            _destinationChainSelector,
            _receiver,
            address(i_usdcToken),
            _amount,
            address(i_linkToken),
            fees
        );

        emit PaymentProcessed(
            messageId, // Use messageId as unique identifier
            msg.sender,
            _seller,
            address(i_usdcToken),
            _amount
        );

        return messageId;
    }

    function _buildCCIPMessage(
        address _receiver,
        uint256 _amount,
        address _buyer,
        address _seller
    ) private view returns (Client.EVM2AnyMessage memory) {
        // Set the token amounts
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(i_usdcToken),
            amount: _amount
        });

        // Encode just buyer and seller
        bytes memory orderData = abi.encode(_buyer, _seller);

        // Build the CCIP Message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver),
                data: orderData,
                tokenAmounts: tokenAmounts,
                extraArgs: Client._argsToBytes(
                    Client.GenericExtraArgsV2({
                        gasLimit: 400_000,
                        allowOutOfOrderExecution: true
                    })
                ),
                feeToken: address(i_linkToken)
            });
    }

    receive() external payable {}

    // Withdraw Link Token
    function withdrawLinkToken(address _beneficiary) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = i_linkToken.balanceOf(address(this));

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        i_linkToken.safeTransfer(_beneficiary, amount);
    }

    // Withdraw USDC from the contract
    function withdrawUsdcToken(address _beneficiary) public onlyOwner {
        uint256 amount = i_usdcToken.balanceOf(address(this));

        if (amount == 0) revert NothingToWithdraw();

        i_usdcToken.safeTransfer(_beneficiary, amount);
    }

    function getLinkTokenBalance() public view returns (uint256) {
        return i_linkToken.balanceOf(address(this));
    }

    function getUsdcTokenBalance() public view returns (uint256) {
        return i_usdcToken.balanceOf(address(this));
    }
}
