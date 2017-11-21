pragma solidity ^0.4.11;

import '../math/SafeMath.sol';
import './Crowdsale.sol';

/**
 * @title CappedCrowdsale
 * @dev Extension of Crowdsale with a max amount of funds raised
 */
contract CappedCrowdsale is Crowdsale {

  struct SoftCap {
    uint256 startTime;
    uint256 cap;
  }

  mapping(uint => SoftCap) internal softCap;
  uint256[15] public milestoneTotalSupply;

  function CappedCrowdsale(uint256[] _capTimes, uint256[] _cap) public {
    require(_capTimes.length == _cap.length);
    require(_capTimes[0] > rate[0].startTime);

    softCap[0].startTime = _capTimes[0];
    softCap[0].cap = _cap[0];

    for(uint8 i = 1; i < _capTimes.length; i++) {
      require(_cap[i] > 0);
      require(_capTimes[i] > _capTimes[i-1]);
      softCap[i].startTime = _capTimes[i];
      softCap[i].cap = _cap[i];
    }
    _capTimes[_capTimes.length - 1];
  }

  function phase() internal constant returns (uint8) {
    for(uint8 i = 0; i < softCap.length; i++) {
      if(now < softCap[i].startTime) {
        return i - 1;
      }
    }
  }

  function setSupply(uint8 phase, uint256 newSupply) internal constant returns (bool) {
    milestoneTotalSupply[phase] = newSupply;
    return softCap[phase].cap >= milestoneTotalSupply[phase];
  }

  // overriding Crowdsale#hasEnded to add hardCap logic
  // @return true if crowdsale event has ended
  function hasEnded() public constant returns (bool) {
    uint256 totalSupply = token.totalSupply();
    bool hardCapReached = weiRaised >= hardCap;
    bool softCapReached = totalSupply >= softCap;
    return super.hasEnded() || hardCapReached || softCapReached;
  }
}
