pragma solidity ^0.4.11;

import "./ControlCentreInterface.sol";
import "../ownership/Ownable.sol";


contract ControlCentre is Ownable {

  // Crowdsale Functions
  function pauseCrowdsale(address _crowdsaleAddress) public onlyOwner returns (bool) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).pause();
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function unpauseCrowdsale(address _crowdsaleAddress) public onlyOwner returns (bool) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).unpause();
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function finishMinting(address _crowdsaleAddress) public onlyOwner returns (bool) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).finishMinting();
    ControlCentreInterface(token).transferOwnership(owner);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function startMinting(address _crowdsaleAddress) public onlyOwner returns (bool) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    require(ControlCentreInterface(_crowdsaleAddress).paused() == true);
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).startMinting();
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  // Data Centre Functions
  function transferDataCentreOwnership(address _crowdsaleAddress, address _nextOwner) public onlyOwner returns (bool) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).pause();
    ControlCentreInterface(token).transferDataCentreOwnership(_nextOwner);
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function returnDataCentreOwnership(address _crowdsaleAddress) public onlyOwner returns (bool) {
    require(address(this) == ControlCentreInterface(_crowdsaleAddress).admins(1));
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    address dataCentreAddr = ControlCentreInterface(token).dataCentreAddr();
    ControlCentreInterface(dataCentreAddr).transferOwnership(token);
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).unpause();
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

}
