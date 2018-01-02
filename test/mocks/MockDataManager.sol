pragma solidity ^0.4.11;

import '../../contracts/controller/DataManager.sol';

contract MockDataManager is DataManager {

  function MockDataManager(address _dataCentreAddr)
    DataManager(_dataCentreAddr)
  {

  }

  function getState() constant returns (bool) {
    return DataCentre(dataCentreAddr).getBool('STK', 'State');
  }

  function getOwner() constant returns (address) {
    return DataCentre(dataCentreAddr).getAddress('STK', 'Address(this)');
  }

  function setState(bool _state) public onlyAdmins {
    _setState(_state);
  }

  function setOwner(address _owner) public onlyAdmins {
    _setOwner(_owner);
  }

  function _setState(bool _state) internal {
    DataCentre(dataCentreAddr).setBool('STK', 'State', _state);
  }

  function _setOwner(address _owner) internal {
    DataCentre(dataCentreAddr).setAddress('STK', 'Address(this)', _owner);
  }

}
