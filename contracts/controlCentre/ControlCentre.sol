pragma solidity ^0.4.11;

import "./ControlCentreInterface.sol";
import "../ownership/Ownable.sol";


contract ControlCentre is Ownable {

  function pauseCrowdsale(address _crowdsaleAddress) public onlyOwner returns (bool) {
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).pause();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).pause();
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function unpauseCrowdsale(address _crowdsaleAddress) public onlyOwner returns (bool) {
    address token = ControlCentreInterface(_crowdsaleAddress).token();
    ControlCentreInterface(_crowdsaleAddress).transferTokenOwnership(address(this));
    ControlCentreInterface(token).unpause();
    ControlCentreInterface(token).transferOwnership(_crowdsaleAddress);
    ControlCentreInterface(_crowdsaleAddress).unpause();
    ControlCentreInterface(_crowdsaleAddress).removeAdmin(address(this));
    return true;
  }

  function transferDataCentreOwnership(address _crowdsaleAddress, address _nextOwner) public onlyOwner returns (bool) {
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
