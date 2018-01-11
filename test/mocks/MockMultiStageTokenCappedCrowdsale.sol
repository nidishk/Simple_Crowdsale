pragma solidity ^0.4.11;

import "../../contracts/crowdsale/multistage/MultiStageTokenCappedCrowdsale.sol";


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
contract MockMultiStageTokenCappedCrowdsale is MultiStageTokenCappedCrowdsale {


  function MockTokenCappedCrowdsale(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _tokenAddr, address _wallet, uint256[] _capTimes, uint256[] _cap)
    MultiStageCrowdsale(_startTime, _ends, _swapRate, _tokenAddr, _wallet)
    MultiStageTokenCappedCrowdsale(_capTimes, _cap)
  {

  }

  function diluteCaps() public {
    // diluting all caps by 10^6 for testing
    for(uint8 i = 0; i < softCap.length; i++) {
      softCap[i].cap = softCap[i].cap.div(1e6);
    }
  }

  function listCaps() public constant returns (uint256[] ends, uint256[] caps) {
    ends = new uint256[](softCap.length);
    caps = new uint256[](softCap.length);
    for (uint256 i = 0; i < rate.length; i++) {
        ends[i] = softCap[i].end;
        caps[i] = softCap[i].cap;
    }

    return (ends, caps);
  }

}
