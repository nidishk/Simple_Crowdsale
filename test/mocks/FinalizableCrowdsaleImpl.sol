pragma solidity ^0.4.11;


import '../../contracts/crowdsale/FinalizableCrowdsale.sol';


contract FinalizableCrowdsaleImpl is FinalizableCrowdsale {

  function FinalizableCrowdsaleImpl (uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _tokenAddr, address _wallet) public
    Crowdsale(_startTime, _ends, _swapRate, _tokenAddr, _wallet)
    FinalizableCrowdsale()
  {
  }

}
