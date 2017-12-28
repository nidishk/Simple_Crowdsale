pragma solidity ^0.4.11;

import './Crowdsale.sol';

/**
 * @title EthCappedCrowdsale
 * @dev Extension of Crowdsale with a max amount of funds raised
 */
contract EthCappedCrowdsale is Crowdsale {

  uint256 public hardCap;

  // in case of crowdsale also being refundable, check _hardCap > goal
  function EthCappedCrowdsale(uint256 _hardCap) public {
    require(_hardCap > 0 );

    hardCap = _hardCap;
  }

  function validPurchase() internal constant returns (bool) {
    bool withinCap = weiRaised.add(msg.value) <= hardCap;
    return super.validPurchase() && withinCap;
  }
}
