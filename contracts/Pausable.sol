pragma solidity ^0.4.11;


import "./ownership/Governable.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is Governable {
  event Pause();
  event Unpause();

  bool public paused = true;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused(address _to) {
    var(adminStatus, ) = isAdmin(_to);
    require(!paused || adminStatus);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused(address _to) {
    var(adminStatus, ) = isAdmin(_to);
    require(paused || adminStatus);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyAdmins whenNotPaused(msg.sender) public {
    paused = true;
    Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyAdmins whenPaused(msg.sender) public {
    paused = false;
    Unpause();
  }
}
