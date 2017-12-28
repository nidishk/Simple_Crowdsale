pragma solidity ^0.4.11;

import '../CrowdsaleBase.sol';

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract Crowdsale is CrowdsaleBase {

  struct Rate {
    uint256 end;
    uint256 swapRate;
  }

  // how many token units a buyer gets per wei
  Rate[15] internal rate;

  function Crowdsale(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _tokenAddr, address _wallet) public
    CrowdsaleBase(_startTime, _tokenAddr, _wallet)
  {
    require(_ends.length == _swapRate.length);
    require(_ends[0] > _startTime);

    endTime = _ends[_ends.length - 1];

    for(uint8 i = 0; i < _ends.length; i++) {
      require(_swapRate[i] > 0);
      if (i != 0) require(_ends[i] > _ends[i-1]);
      rate[i].end = _ends[i];
      rate[i].swapRate = _swapRate[i];
    }
  }

  function currentRate() public constant returns (uint256) {
    if(now < startTime) return  0;

    for(uint8 i = 0; i < rate.length; i++) {
      if(now < rate[i].end) {
        return rate[i].swapRate;
      }
    }
  }

  // low level tokenAddr purchase function
  function buyTokens(address beneficiary) public payable {
    _buyTokens(beneficiary, currentRate());
  }
}
