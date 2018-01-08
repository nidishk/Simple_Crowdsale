pragma solidity ^0.4.11;

import "../../contracts/crowdsale/multistage/Crowdsale.sol";


/**
 * @title SampleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * HardCappedCrowdsale - sets a max boundary for raised funds
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract MockMultiStageCrowdsale is Crowdsale {


    function MockMultiStageCrowdsale(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _wallet, address controller) public
        Crowdsale(_startTime, _ends, _swapRate, _wallet, controller)
    {

    }

    function listRates() public constant returns (uint256[] endTimes, uint256[] swapRates) {
        endTimes = new uint256[](rate.length);
        swapRates = new uint256[](rate.length);
        for (uint256 i = 0; i < rate.length; i++) {
            endTimes[i] = rate[i].end;
            swapRates[i] = rate[i].swapRate;
        }

        return (endTimes, swapRates);
    }

}
