pragma solidity ^0.4.11;

import "./MultiStageCrowdsaleBase.sol";


/**
 * @title Crowdsale
 * @dev Crowdsale is a  contract for managing a token crowdsale with multiple rates.
 * The end times for each of the swap rates must be put in epoch format in an array
 * along with the corresponding swapRates. The last term in ends[] must be the endTime
 * of the crowdsale
 */
contract CrowdsaleTokenMilestones is MultiStageCrowdsaleBase {

    uint256 public totalSupply;

    function CrowdsaleTokenMilestones(uint256 _startTime, uint256 _endTime, uint256[] _tokenEnds, uint256[] _swapRate, address _wallet, address _controller) public
        MultiStageCrowdsaleBase(_startTime, _tokenEnds, _swapRate, _wallet, _controller)
    {
        require(_endTime > _startTime);
        endTime = _endTime;
    }

    // low level tokenAddr purchase function
    function buyTokens(address beneficiary) public payable {
        uint256 tokens = _buyTokens(beneficiary, currentRate());
        setSupply(0, totalSupply.add(tokens));
    }

    function currentRate() public constant returns (uint256) {
        if (now < startTime) {
            return  0;
        }

        for (uint8 i = 0; i < rate.length; i++) {
            if (totalSupply < rate[i].end) {
                return rate[i].swapRate;
            }
        }
    }

    function setSupply(uint8 currentPhase, uint256 newSupply) internal constant returns (bool) {
        totalSupply = newSupply;
        return true;
    }
}
