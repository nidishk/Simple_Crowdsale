pragma solidity ^0.4.11;

import './base/SimpleControl.sol';

/**
 * @title PausedToken
 * @dev Extension of SimpleControl with pausable tokens.
 * Owner can pause transfers and approval.
 */
contract PausedToken is SimpleControl {

  // public functions
  function approve(address _spender, uint256 _value) public whenNotPaused returns (bool) {
    return super.approve(_spender, _value);
  }

  function transfer(address _to, uint256 _value) public whenNotPaused returns (bool) {
    return super.transfer(_to, _value);
  }

  function transfer(address to, uint value, bytes data) public whenNotPaused returns (bool) {
    return super.transfer(to, value, data);
  }

  function transferFrom(address _from, address _to, uint _value) public whenNotPaused returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _amount, bytes _data) public whenNotPaused returns (bool) {
    return super.transferFrom(_from, _to, _amount, _data);
  }

}
