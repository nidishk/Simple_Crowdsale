pragma solidity ^0.4.11;

import "./SimpleControl.sol";
import "../token/Token.sol";


contract CrowdsaleControl is SimpleControl {
    
    using SafeMath for uint;

    // not necessary to store in data centre
    bool public mintingFinished = false;

    modifier canMint(bool status, address _to) {
        var(adminStatus, ) = isAdmin(_to);
        require(!mintingFinished == status || adminStatus);
        _;
    }

    function CrowdsaleControl(address _satellite, address _dataCentreAddr)
        SimpleControl(_satellite, _dataCentreAddr)
    {

    }

    function mint(address _to, uint256 _amount) whenNotPaused(_to) canMint(true, msg.sender) onlyAdmins public returns (bool) {
        _setTotalSupply(totalSupply().add(_amount));
        _setBalanceOf(_to, balanceOf(_to).add(_amount));
        Token(satellite).mint(_to, _amount);
        return true;
    }

    function startMinting() public onlyAdmins returns (bool) {
        mintingFinished = false;
        Token(satellite).mintToggle(mintingFinished);
        return true;
    }

    function finishMinting() public onlyAdmins returns (bool) {
        mintingFinished = true;
        Token(satellite).mintToggle(mintingFinished);
        return true;
    }

}