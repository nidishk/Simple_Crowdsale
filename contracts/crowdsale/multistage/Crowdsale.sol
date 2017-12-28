pragma solidity ^0.4.11;

import '../CrowdsaleBase.sol';

/**
 * @title Crowdsale
 * @dev Crowdsale is a  contract for managing a token crowdsale with multiple rates.
 * The end times for each of the swap rates must be put in epoch format in an array
 * along with the corresponding swapRates. The last term in ends[] must be the endTime
 * of the crowdsale
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
