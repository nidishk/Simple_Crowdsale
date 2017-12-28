pragma solidity ^0.4.11;

import './WhiteList.sol';
import './singlestage/Crowdsale.sol';

contract WhiteListedCrowdsale is Crowdsale {

  address public whitelistAddr;

  modifier onlyWhiteListed() {
    require(WhiteList(whitelistAddr).isWhiteListed(msg.sender));
    _;
  }

  function WhiteListedCrowdsale(address _whiteListAddr) public {
    whitelistAddr = _whiteListAddr;
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public onlyWhiteListed payable {
    super.buyTokens(beneficiary);
  }
}
