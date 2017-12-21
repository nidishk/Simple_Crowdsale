pragma solidity ^0.4.11;

import './Crowdsale.sol';

/**
 * @title CappedCrowdsale
 * @dev Extension of Crowdsale with a max amount of funds raised
 */
contract CappedCrowdsale is Crowdsale {

  struct SoftCap {
    uint256 end;
    uint256 cap;
  }

  SoftCap[15] public softCap;
  uint256[15] public milestoneTotalSupply;

  function CappedCrowdsale(uint256[] _capTimes, uint256[] _cap) public {
    require(_capTimes.length == _cap.length);
    require(_capTimes[0] > startTime);

    for(uint8 i = 0; i < _capTimes.length; i++) {
      require(_cap[i] > 0);
      if(i != 0) require(_capTimes[i] > _capTimes[i-1]);
      softCap[i].end = _capTimes[i];
      softCap[i].cap = _cap[i];
    }
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;
    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(currentRate());
    uint8 currentPhase = phase();
    require(setSupply(currentPhase, milestoneTotalSupply[currentPhase].add(tokens)));

    // update state
    weiRaised = weiRaised.add(weiAmount);

    Token(tokenAddr).mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  function phase() internal constant returns (uint8) {
    for(uint8 i = 0; i < softCap.length; i++) {
      if(now < softCap[i].end) {
        return i;
      }
    }
  }

  function setSupply(uint8 currentPhase, uint256 newSupply) internal constant returns (bool) {
    milestoneTotalSupply[currentPhase] = newSupply;
    return softCap[currentPhase].cap >= milestoneTotalSupply[currentPhase];
  }

}
