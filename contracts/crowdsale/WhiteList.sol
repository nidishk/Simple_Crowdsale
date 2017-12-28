pragma solidity 0.4.18;

import "../ownership/Ownable.sol";

/**
 * @title WhiteList
 * @dev This contract is used for storing whiteListed addresses before a crowdsale
 * is in progress. Only owner can add and remove white lists and address of this contract must be
 * set in the WhiteListedCrowdsale contract
 */
contract WhiteList is Ownable {
  mapping (address => bool) internal whiteListMap;

  function isWhiteListed(address investor) constant returns (bool) {
    return whiteListMap[investor];
  }

  function addWhiteListed(address whiteListAddress) public onlyOwner {
    require(whiteListMap[whiteListAddress] == false);
    whiteListMap[whiteListAddress] = true;
  }

  function removeWhiteListed(address whiteListAddress) public onlyOwner {
    require(whiteListMap[whiteListAddress] == true);
    whiteListMap[whiteListAddress] = false;
  }

}
