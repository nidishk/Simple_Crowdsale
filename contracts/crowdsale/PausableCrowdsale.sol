pragma solidity ^0.4.11;

import '../Pausable.sol';
import './multistage/Crowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract PausableCrowdsale is Crowdsale, Pausable {

  // Admin Functions
  function setContracts(address _tokenAddr, address _wallet) onlyAdmins whenPaused {
    wallet = _wallet;
    tokenAddr = _tokenAddr;
  }

  function transferTokenOwnership(address _nextOwner) onlyAdmins whenPaused {
    Token(tokenAddr).transferOwnership(_nextOwner);
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public whenNotPaused payable {
    super.buyTokens(beneficiary);
  }
}
