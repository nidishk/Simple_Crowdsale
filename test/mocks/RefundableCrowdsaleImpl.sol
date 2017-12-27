pragma solidity ^0.4.11;


import '../../contracts/crowdsale/RefundableCrowdsale.sol';


contract RefundableCrowdsaleImpl is RefundableCrowdsale {

  function RefundableCrowdsaleImpl (uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet, uint256 _goal) public
    Crowdsale(_startTime, _endTime, _rate, _tokenAddr, _wallet)
    RefundableCrowdsale(_goal)
  {

  }

}
