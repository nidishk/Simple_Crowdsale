pragma solidity ^0.4.11;

import '../token/Token.sol';


/**
 Simple Token based on OpenZeppelin token contract
 */
contract SimpleToken is Token {

  string public constant name = "Simple Token";
  string public constant symbol = "STK";
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 28350000 * (10 ** uint256(decimals));

  function SimpleToken(address _dataCentreAddr)
    Token(_dataCentreAddr)
  {

  }

}
