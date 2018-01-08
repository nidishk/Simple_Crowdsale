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

  }

  // Owner Functions
  function setContracts(address _satellite, address _dataCentreAddr) public onlyAdmins whenPaused(msg.sender) {
    dataCentreAddr = _dataCentreAddr;
    satellite = _satellite;
  }

  function kill(address _newController) public onlyAdmins whenPaused(msg.sender) {
    if (dataCentreAddr != address(0)) { Ownable(dataCentreAddr).transferOwnership(msg.sender); }
    if (satellite != address(0)) { Ownable(satellite).transferOwnership(msg.sender); }
    selfdestruct(_newController);
  }

}
