pragma solidity ^0.4.11;


import '../../contracts/crowdsale/WhiteListedCrowdsale.sol';


contract WhiteListedCrowdsaleImpl is WhiteListedCrowdsale {

  function WhiteListedCrowdsaleImpl (uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet, address _whiteList) public
    Crowdsale(_startTime, _endTime, _rate, _tokenAddr, _wallet)
    WhiteListedCrowdsale(_whiteList)
  {
  }

}
