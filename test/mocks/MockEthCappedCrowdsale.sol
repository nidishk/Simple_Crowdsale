pragma solidity ^0.4.11;

import "../../contracts/crowdsale/singlestage/EthCappedCrowdsale.sol";


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
contract MockEthCappedCrowdsale is EthCappedCrowdsale {


  function MockEthCappedCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address _controller, uint256 _hardCap)
    Crowdsale(_startTime, _endTime, _rate, _wallet, _controller)
    EthCappedCrowdsale(_hardCap)
  {

  }

  function diluteCap() public {
    // diluting all caps by 10^6 for testing
    hardCap = hardCap.div(1e6);
  }
}
