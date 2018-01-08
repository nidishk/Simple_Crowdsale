pragma solidity ^0.4.16;


import "../../contracts/crowdsale/WhiteListedCrowdsale.sol";


contract WhiteListedCrowdsaleImpl is WhiteListedCrowdsale {

    function WhiteListedCrowdsaleImpl (uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address controller, address _whiteList) public
        Crowdsale(_startTime, _endTime, _rate, _wallet, controller)
        WhiteListedCrowdsale(_whiteList)
    {
        
    }

}