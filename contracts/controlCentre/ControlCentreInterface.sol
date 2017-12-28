pragma solidity ^0.4.11;

/**
 * @title ControlCentreInterface
 * @dev ControlCentreInterface is an interface for providing commonly used function
 * signatures to the ControlCentre
 */
contract ControlCentreInterface {

  bool public paused;
  bool public mintingFinished;
  address[] public admins;
  address public owner;
  address public tokenAddr;
  address public dataCentreAddr;

  function pause() public;
  function unpause() public;
  function startMinting() public returns (bool);
  function finishMinting() public returns (bool);
  function transferOwnership(address newOwner) public;
  function setContracts(address _token, address _wallet);
  function removeAdmin(address _admin) public;
  function setDataCentreAddress(address _dataCentreAddr) public;
  function transferTokenOwnership(address _nextOwner);
  function transferDataCentreOwnership(address _nextOwner) public;
}
