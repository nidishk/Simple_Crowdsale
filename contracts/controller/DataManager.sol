pragma solidity ^0.4.11;

import '../token/DataCentre.sol';
import '../Pausable.sol';

contract DataManager is Pausable {

  // satelite contract addresses
  address public dataCentreAddr;

  function DataManager(address _dataCentreAddr) {
    dataCentreAddr = _dataCentreAddr == address(0) ? address(createDataCentre()) : _dataCentreAddr;
  }

  // Constant Functions
  function balanceOf(address _owner) constant returns (uint256) {
    return DataCentre(dataCentreAddr).getBalanace('STK', _owner);
  }

  function totalSupply() constant returns (uint256) {
    return DataCentre(dataCentreAddr).getValue('STK', 'totalSupply');
  }

  function allowance(address _owner, address _spender) constant returns (uint256) {
    return DataCentre(dataCentreAddr).getConstraint('STK', _owner, _spender);
  }

  // Internal Functions
  function createDataCentre() internal returns (DataCentre) {
    return new DataCentre();
  }

  function _setTotalSupply(uint256 _newTotalSupply) internal {
    DataCentre(dataCentreAddr).setValue('STK', 'totalSupply', _newTotalSupply);
  }

  function _setBalanceOf(address _owner, uint256 _newValue) internal {
    DataCentre(dataCentreAddr).setBalanace('STK', _owner, _newValue);
  }

  function _setAllowance(address _owner, address _spender, uint256 _newValue) internal {
    require(balanceOf(_owner) >= _newValue);
    DataCentre(dataCentreAddr).setConstraint('STK', _owner, _spender, _newValue);
  }

}
