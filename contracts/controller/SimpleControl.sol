pragma solidity ^0.4.11;

import "./DataManager.sol";
import "../SafeMath.sol";


contract SimpleControl is DataManager {
   
    using SafeMath for uint;

    // not necessary to store in data centre  address public satellite;

    address public satellite;

    modifier onlyToken {
        require(msg.sender == satellite);
        _;
    }


    function SimpleControl(address _satellite, address _dataCentreAddr) public
        DataManager(_dataCentreAddr)
    {
        satellite = _satellite;
    }

    // public functions
    function approve(address _owner, address _spender, uint256 _value) public onlyToken whenNotPaused(_owner) {
        require(_owner != _spender);
        _setAllowance(_owner, _spender, _value);
    }


    function transfer(address _from, address _to, uint256 _amount, bytes _data) public onlyToken whenNotPaused(_from) {
        _transfer(_from, _to, _amount, _data);
    }

    function transferFrom(address _sender, address _from, address _to, uint256 _amount, bytes _data) public onlyToken whenNotPaused(_sender) {
        _setAllowance(_from, _to, allowance(_from, _to).sub(_amount));
        _transfer(_from, _to, _amount, _data);
    }
    
    function _transfer(address _from, address _to, uint256 _amount, bytes _data) internal {
        require(_to != address(this));
        require(_to != address(0));
        require(_amount > 0);
        require(_from != _to);
        _setBalanceOf(_from, balanceOf(_from).sub(_amount));
        _setBalanceOf(_to, balanceOf(_to).add(_amount));
    }

}
