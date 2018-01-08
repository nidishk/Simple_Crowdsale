pragma solidity ^0.4.11;

import "./MultiStageCrowdsaleBase.sol";


/**
 * @title Crowdsale
 * @dev Crowdsale is a  contract for managing a token crowdsale with multiple rates.
 * The end times for each of the swap rates must be put in epoch format in an array
 * along with the corresponding swapRates. The last term in ends[] must be the endTime
 * of the crowdsale
 */
contract Crowdsale is MultiStageCrowdsaleBase {

    function Crowdsale(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _wallet, address _controller) public
        MultiStageCrowdsaleBase(_startTime, _ends, _swapRate, _wallet, _controller)
    {
        require(_ends[0] > _startTime);
        endTime = _ends[_ends.length - 1];
    }

    // low level tokenAddr purchase function
    function buyTokens(address beneficiary) public payable {
        _buyTokens(beneficiary, currentRate());
    }

    function currentRate() public constant returns (uint256) {
        if (now < startTime) {
            return  0;
        }

        for (uint8 i = 0; i < rate.length; i++) {
            if (now < rate[i].end) {
                return rate[i].swapRate;
            }
        }
    }

}
