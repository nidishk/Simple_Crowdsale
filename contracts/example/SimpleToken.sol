pragma solidity ^0.4.11;

import "../token/Token.sol";


/**
 Simple Token based on OpenZeppelin token contract
 */
contract SimpleToken is Token {

    string public constant name = "simple token";
    string public constant symbol = "stk";
    uint8 public constant decimals = 18;

}