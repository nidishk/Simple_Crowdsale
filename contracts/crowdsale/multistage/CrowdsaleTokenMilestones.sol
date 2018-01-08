pragma solidity ^0.4.11;

import '../CrowdsaleBase.sol';
import './RateLogic/TokenMilestones.sol';

/**
 * @title Crowdsale
 * @dev Crowdsale is a  contract for managing a token crowdsale with multiple rates.
 * The end times for each of the swap rates must be put in epoch format in an array
 * along with the corresponding swapRates. The last term in ends[] must be the endTime
 * of the crowdsale
 */
contract CrowdsaleTokenMilestones is CrowdsaleBase, TokenMilestones {

  function CrowdsaleTokenMilestones(uint256 _startTime, uint256 _endTime, uint256[] _tokenEnds, uint256[] _swapRate, address _wallet, address _controller) public
    CrowdsaleBase(_startTime, _wallet, _controller)
  {
    require(_tokenEnds.length == _swapRate.length);
    require(_endTime > _startTime);

    endTime = _endTime;

    for(uint8 i = 0; i < _tokenEnds.length; i++) {
      require(_swapRate[i] > 0);
      if (i != 0) require(_tokenEnds[i] > _tokenEnds[i-1]);
      rate[i].end = _tokenEnds[i];
      rate[i].swapRate = _swapRate[i];
    }
  }

  // low level tokenAddr purchase function
  function buyTokens(address beneficiary) public payable {
    uint256 tokens = _buyTokens(beneficiary, currentRate());
    setSupply(0, totalSupply.add(tokens));
  }

  function setSupply(uint8 currentPhase, uint256 newSupply) internal constant returns (bool) {
    totalSupply = newSupply;
    return true;
  }
}
