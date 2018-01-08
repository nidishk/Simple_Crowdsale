pragma solidity ^0.4.11;

import "../ownership/Ownable.sol";
import "../ERC20.sol";
import "../ERC223ReceivingContract.sol";
import "../controller/ControllerInterface.sol";


contract Token is Ownable, ERC20 {

    uint256 public constant INITIAL_SUPPLY = 28350000e18;

    event Mint(address indexed to, uint256 amount);
    event MintToggle(bool status);

    // Constant Functions
    function balanceOf(address _owner) public constant returns (uint256) {
        return ControllerInterface(owner).balanceOf(_owner);
    }

    function totalSupply() public constant returns (uint256) {
        return ControllerInterface(owner).totalSupply();
    }

    function allowance(address _owner, address _spender) public constant returns (uint256) {
        return ControllerInterface(owner).allowance(_owner, _spender);
    }

    function mint(address _to, uint256 _amount) public onlyOwner returns (bool) {
        bytes memory empty;
        _checkDestination(address(this), _to, _amount, empty);
        Mint(_to, _amount);
        Transfer(address(0), _to, _amount);
        return true;
    }

    function mintToggle(bool status) public onlyOwner returns (bool) {
        MintToggle(status);
        return true;
    }

    // public functions
    function approve(address _spender, uint256 _value) public returns (bool) {
        ControllerInterface(owner).approve(msg.sender, _spender, _value);
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        bytes memory empty;
        return transfer(_to, _value, empty);
    }

    function transfer(address to, uint value, bytes data) public returns (bool) {
        ControllerInterface(owner).transfer(msg.sender, to, value, data);
        Transfer(msg.sender, to, value);
        _checkDestination(msg.sender, to, value, data);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        bytes memory empty;
        return transferFrom(_from, _to, _value, empty);
    }

    function transferFrom(address _from, address _to, uint256 _amount, bytes _data) public returns (bool) {
        ControllerInterface(owner).transferFrom(msg.sender, _from, _to, _amount, _data);
        Transfer(_from, _to, _amount);
        _checkDestination(_from, _to, _amount, _data);
        return true;
    }

    // Internal Functions
    function _checkDestination(address _from, address _to, uint256 _value, bytes _data) internal {

        uint256 codeLength;
        assembly {
            codeLength := extcodesize(_to)
        }
        if (codeLength > 0) {
            ERC223ReceivingContract untrustedReceiver = ERC223ReceivingContract(_to);
            // untrusted contract call
            untrustedReceiver.tokenFallback(_from, _value, _data);
        }
    }
}
