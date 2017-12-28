pragma solidity 0.4.18;

import "../ownership/Ownable.sol";


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
