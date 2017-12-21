pragma solidity ^0.4.11;

import "./ControlCentreInterface.sol";
import "../ownership/Ownable.sol";


contract ControlCentre is Ownable {

  modifier hasRight(address _crowdsaleAddress) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    _;
  }

  // Crowdsale Functions
  function pauseCrowdsale(address _crowdsaleAddress) public onlyOwner hasRight(_crowdsaleAddress) returns (bool) {
    address tokenAddr = ControlCentreInterface(_crowdsaleAddress).tokenAddr();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(tokenAddr).pause();
    ControlCentreInterface(tokenAddr).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function unpauseCrowdsale(address _crowdsaleAddress) public onlyOwner hasRight(_crowdsaleAddress) returns (bool) {
    address tokenAddr = ControlCentreInterface(_crowdsaleAddress).tokenAddr();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(tokenAddr).unpause();
    ControlCentreInterface(tokenAddr).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function finishMinting(address _crowdsaleAddress) public onlyOwner hasRight(_crowdsaleAddress) returns (bool) {
    address tokenAddr = ControlCentreInterface(_crowdsaleAddress).tokenAddr();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(tokenAddr).finishMinting();
    ControlCentreInterface(tokenAddr).transferOwnership(owner);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function startMinting(address _crowdsaleAddress) public onlyOwner hasRight(_crowdsaleAddress) returns (bool) {
    require(ControlCentreInterface(_crowdsaleAddress).paused() == true);
    address tokenAddr = ControlCentreInterface(_crowdsaleAddress).tokenAddr();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(tokenAddr).startMinting();
    ControlCentreInterface(tokenAddr).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  // Data Centre Functions
  function transferDataCentreOwnership(address _crowdsaleAddress, address _nextOwner) public onlyOwner hasRight(_crowdsaleAddress) returns (bool) {
    address tokenAddr = ControlCentreInterface(_crowdsaleAddress).tokenAddr();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(tokenAddr).pause();
    ControlCentreInterface(tokenAddr).transferDataCentreOwnership(_nextOwner);
    ControlCentreInterface(tokenAddr).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function returnDataCentreOwnership(address _crowdsaleAddress) public onlyOwner hasRight(_crowdsaleAddress) returns (bool) {
    address tokenAddr = ControlCentreInterface(_crowdsaleAddress).tokenAddr();
    address dataCentreAddr = ControlCentreInterface(tokenAddr).dataCentreAddr();
    ControlCentreInterface(dataCentreAddr).transferOwnership(tokenAddr);
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(tokenAddr).unpause();
    ControlCentreInterface(tokenAddr).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

}
