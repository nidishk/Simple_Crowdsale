pragma solidity ^0.4.11;

import '../../contracts/token/TransferLockedToken.sol';
import '../../contracts/token/base/Token.sol';

contract MockTransferLockedToken is TransferLockedToken, Token {

  function MockTransferLockedToken(address _dataCentreAddr)
    TransferLockedToken()
    Token(_dataCentreAddr)
  {

  }

}
