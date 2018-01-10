pragma solidity ^0.4.11;

import './FinalizableCrowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract AllocateEther is FinalizableCrowdsale {

  // send ether to the fund collection wallet
  // called when owner calls finalize()
  function finalization() internal {
    require(wallet.call.gas(2000).value(this.balance)());
    super.finalization();
  }

  // send ether to the fund collection wallet
  // overriding to keep funds in contract
  function forwardFunds() internal {

  }
}
