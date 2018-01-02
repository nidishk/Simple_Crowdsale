pragma solidity ^0.4.11;

import '../CrowdsaleControl.sol';

/**
 * @title TransferLockedToken
 * @dev Extension of SimpleControl with a transfer locked tokens.
 * Tokens can only be transferred after minting is finished
 */
contract TransferLockedToken is CrowdsaleControl {

  // public functions
  function approve(address _owner, address _spender, uint256 _value) public canMint(false){
    return super.approve(_owner, _spender, _value);
  }

  function transfer(address _owner, address to, uint value, bytes data) public canMint(false) {
    return super.transfer(_owner, to, value, data);
  }

  function transferFrom(address _owner, address _from, address _to, uint256 _amount, bytes _data) public canMint(false) {
    return super.transferFrom(_owner, _from, _to, _amount, _data);
  }

}
