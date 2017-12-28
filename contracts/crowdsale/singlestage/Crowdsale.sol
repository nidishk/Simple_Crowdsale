pragma solidity ^0.4.18;

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

  uint256 public rate;

  function Crowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _tokenAddr, address _wallet) public
    CrowdsaleBase(_startTime, _tokenAddr, _wallet)
  {
    require(_endTime >= _startTime);
    require(_rate > 0);

    endTime = _endTime;
    rate = _rate;
  }

  // low level tokenAddr purchase function
  function buyTokens(address beneficiary) public payable {
    _buyTokens(beneficiary, rate);
  }
}
