pragma solidity ^0.4.11;

/**
 * @title ControlCentreInterface
 * @dev ControlCentreInterface is an interface for providing commonly used function
 * signatures to the ControlCentre
 */
contract ControllerInterface {

  function totalSupply() constant returns (uint256);
  function balanceOf(address _owner) constant returns (uint256);
  function allowance(address _owner, address _spender) constant returns (uint256);

  function approve(address owner, address spender, uint256 value) public returns (bool);
  function transfer(address owner, address to, uint value, bytes data) public returns (bool);
  function transferFrom(address owner, address from, address to, uint256 amount, bytes data) public returns (bool);
  function mint(address _to, uint256 _amount)  public returns (bool);
}
