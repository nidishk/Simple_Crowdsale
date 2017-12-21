pragma solidity ^0.4.11;

import './SimpleControl.sol';


/**
 Simple Token based on OpenZeppelin token contract
 */
contract Token is SimpleControl {

  uint256 public constant INITIAL_SUPPLY = 28350000 * 1e18;

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function Token(address _dataCentreAddr)
    SimpleControl(_dataCentreAddr)
  {
    if(_dataCentreAddr == address(0)) {

    // initial token distribution to be put in here
    _setTotalSupply(INITIAL_SUPPLY);
    _setBalanceOf(msg.sender, INITIAL_SUPPLY);
    }
  }

}
