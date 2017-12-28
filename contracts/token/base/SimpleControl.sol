pragma solidity ^0.4.11;

import '../../SafeMath.sol';
import '../../ERC20.sol';
import '../../ERC223ReceivingContract.sol';
import './DataManager.sol';

contract SimpleControl is ERC20, DataManager {
  using SafeMath for uint;

  // not necessary to store in data centre
  bool public mintingFinished = false;

  event Mint(address indexed to, uint256 amount);
  event MintToggle(bool status);

  modifier canMint(bool status) {
    require(!mintingFinished == status);
    _;
  }

  function SimpleControl(address _dataCentreAddr)
    DataManager(_dataCentreAddr) {
  }

  // public functions
  function approve(address _spender, uint256 _value) public returns (bool) {
    require(msg.sender != _spender);
    _setAllowance(msg.sender, _spender, _value);
    return true;
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    bytes memory empty;
    return transfer(_to, _value, empty);
  }

  function transfer(address to, uint value, bytes data) public returns (bool) {
    _transfer(msg.sender, to, value, data);
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) public returns (bool) {
    bytes memory empty;
    return transferFrom(_from, _to, _value, empty);
  }


  function transferFrom(address _from, address _to, uint256 _amount, bytes _data) public returns (bool) {
    _setAllowance(_from, _to, allowance(_from, _to).sub(_amount));
    _transfer(_from, _to, _amount, _data);
    return true;
  }

  function mint(address _to, uint256 _amount) onlyOwner canMint(true) public returns (bool) {
    bytes memory empty;
    _setTotalSupply(totalSupply().add(_amount));
    _setBalanceOf(_to, balanceOf(_to).add(_amount));
    _checkDestination(msg.sender, _to, _amount, empty);
    Mint(_to, _amount);
    Transfer(address(0), _to, _amount);
    return true;
  }

  function startMinting() onlyOwner public returns (bool) {
    mintingFinished = false;
    MintToggle(mintingFinished);
    return true;
  }

  function finishMinting() onlyOwner public returns (bool) {
    mintingFinished = true;
    MintToggle(mintingFinished);
    return true;
  }

  // Internal Functions
  function _checkDestination(address _from, address _to, uint256 _value, bytes _data) internal {

    uint256 codeLength;
    assembly {
      codeLength := extcodesize(_to)
    }
    if(codeLength>0) {
      ERC223ReceivingContract untrustedReceiver = ERC223ReceivingContract(_to);
      // untrusted contract call
      untrustedReceiver.tokenFallback(_from, _value, _data);
    }
  }

  function _transfer(address _from, address _to, uint256 _amount, bytes _data) internal {
    require(_to != address(this));
    require(_to != address(0));
    require(_amount > 0);
    require(_from != _to);
    _setBalanceOf(_from, balanceOf(_from).sub(_amount));
    _setBalanceOf(_to, balanceOf(_to).add(_amount));
    _checkDestination(_from, _to, _amount, _data);
    Transfer(_from, _to, _amount);
  }
}
