pragma solidity ^0.4.16;

import "../crowdsale/singlestage/TokenCappedCrowdsale.sol";
import "../crowdsale/RefundableCrowdsale.sol";


/**
 * @title SimpleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In order to switch between multistage and single stage, one must also change base contract import of the add-ons.
 * In this example we are providing following extensions:
 * TokenCappedCrowdsale - sets a max boundary for Token sold in milestones
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract SimpleCrowdsale is TokenCappedCrowdsale, RefundableCrowdsale {

    function SimpleCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address controller, uint256 _cap, uint256 _goal) public
        Crowdsale(_startTime, _endTime, _rate, _wallet, controller)
        TokenCappedCrowdsale(_cap)
        RefundableCrowdsale(_goal)
    {
        // require(_cap.div(rate) > _goal);
    }

}
