pragma solidity ^0.4.11;

import './CrowdsaleControl.sol';


/**
 Simple Token based on OpenZeppelin token contract
 */
contract Controller is CrowdsaleControl {

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function Controller(address _satellite, address _dataCentreAddr)
    CrowdsaleControl(_satellite, _dataCentreAddr)
  {
    if(_dataCentreAddr == address(0)) {

    // initial token distribution to be put in here
    uint256 initialSupply = Token(satellite).INITIAL_SUPPLY();
    _setTotalSupply(initialSupply);
    _setBalanceOf(msg.sender, initialSupply);
    }
  }

  // Owner Functions
  function setContracts(address _satellite, address _dataCentreAddr) public onlyAdmins whenPaused {
    dataCentreAddr = _dataCentreAddr;
    satellite = _satellite;
  }

  function kill(address _newController) public onlyAdmins whenPaused {
    if (dataCentreAddr != address(0)) { Ownable(dataCentreAddr).transferOwnership(msg.sender); }
    if (satellite != address(0)) { Ownable(satellite).transferOwnership(msg.sender); }
    selfdestruct(_newController);
  }

}
