pragma solidity ^0.4.11;

import "../../contracts/controller/Controller.sol";
import "../../contracts/controller/add-ons/TransferLockedToken.sol";


contract MockTransferLockedTokenControl is TransferLockedToken, Controller {

    function MockTransferLockedTokenControl(address _satellite, address _dataCentreAddr) public
        TransferLockedToken()
        Controller(_satellite, _dataCentreAddr)
    {

    }
}
