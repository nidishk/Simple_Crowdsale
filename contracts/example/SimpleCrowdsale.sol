pragma solidity ^0.4.11;

import "../crowdsale/CappedCrowdsale.sol";
import "../Pausable.sol";


/**
 * @title SimpleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * HardCappedCrowdsale - sets a max boundary for raised funds
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract SimpleCrowdsale is CappedCrowdsale, Pausable {


  function SimpleCrowdsale(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _tokenAddr, address _wallet, uint256[] _capTimes, uint256[] _cap)
    Crowdsale(_startTime, _ends, _swapRate, _tokenAddr, _wallet)
    CappedCrowdsale(_capTimes, _cap)
  {

  }

  // Admin Functions
  function setContracts(address _tokenAddr, address _wallet) onlyAdmins whenPaused {
    wallet = _wallet;
    token = Token(_tokenAddr);
  }

  function transferTokenOwnership(address _nextOwner) onlyAdmins whenPaused {
    token.transferOwnership(_nextOwner);
  }
}
