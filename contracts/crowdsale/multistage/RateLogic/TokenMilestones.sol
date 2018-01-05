pragma solidity ^0.4.11;

import '../../CrowdsaleBase.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract TokenMilestones is CrowdsaleBase {

  uint public totalSupply;

  struct Rate {
    uint256 end;
    uint256 swapRate;
  }

  // how many token units a buyer gets per wei
  Rate[15] internal rate;

  function currentRate() public constant returns (uint256) {
    if(now < startTime) return  0;

    for(uint8 i = 0; i < rate.length; i++) {

      if(totalSupply < rate[i].end) {
        return rate[i].swapRate;
      }
    }
  }
}
