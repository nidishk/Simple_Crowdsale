pragma solidity ^0.4.11;

import './base/SimpleControl.sol';

/**
 * @title TransferLockedToken
 * @dev Extension of SimpleControl with a transfer locked tokens.
 * Tokens can only be transferred after minting is finished
 */
contract TransferLockedToken is SimpleControl {

  // public functions
  function approve(address _spender, uint256 _value) public canMint(false) returns (bool) {
    return super.approve(_spender, _value);
  }

  function transfer(address _to, uint256 _value) public canMint(false) returns (bool) {
    return super.transfer(_to, _value);
  }

  function transfer(address to, uint value, bytes data) public canMint(false) returns (bool) {
    return super.transfer(to, value, data);
  }

  function transferFrom(address _from, address _to, uint _value) public canMint(false) returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _amount, bytes _data) public canMint(false) returns (bool) {
    return super.transferFrom(_from, _to, _amount, _data);
  }

}
