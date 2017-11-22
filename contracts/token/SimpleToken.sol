pragma solidity ^0.4.11;

import './SimpleControl.sol';


/**
 Simple Token based on OpenZeppelin token contract
 */
contract SimpleToken is SimpleControl {

  string public constant name = "Simple Token";
  string public constant symbol = "STK";
  uint8 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 28350000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function SimpleToken(address _dataCentreAddr)
    SimpleControl(_dataCentreAddr)
  {
    if(_dataCentreAddr == address(0)) {

    // initial token distribution to be put in here
    _setTotalSupply(INITIAL_SUPPLY);
    _setBalanceOf(msg.sender, INITIAL_SUPPLY);
    }
  }

}
