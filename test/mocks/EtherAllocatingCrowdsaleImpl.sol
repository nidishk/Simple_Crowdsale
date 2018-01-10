pragma solidity ^0.4.16;


import "../../contracts/crowdsale/FinalizableCrowdsale.sol";
import "../../contracts/crowdsale/AllocateEther.sol";


contract EtherAllocatingCrowdsaleImpl is AllocateEther {

    function EtherAllocatingCrowdsaleImpl (uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address controller) public
        Crowdsale(_startTime, _endTime, _rate, _wallet, controller)
        AllocateEther()
    {

    }

}
