// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

contract Escrow is CCIPReceiver {
    address public latestSender;
    string public latestMessage;

    constructor(address router) CCIPReceiver(router) {

    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        latestSender = abi.decode(message.sender, (address));
        latestMessage = abi.decode(message.data , (string));
    }
}