pragma solidity ^0.4.11;

import '../../contracts/token/PausedToken.sol';
import '../../contracts/token/Token.sol';

contract MockPausedToken is PausedToken, Token {

  function MockPausedToken(address _dataCentreAddr)
    PausedToken()
    Token(_dataCentreAddr)
  {

  }

}
