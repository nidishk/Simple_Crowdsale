pragma solidity ^0.4.16;

import "./WhiteList.sol";
import "./singlestage/Crowdsale.sol";


/**
 * @title WhiteListedCrowdsale
 * @dev Extension of Crowdsale where only White Listed addresses can
 * buy Tokens.
 */
contract WhiteListedCrowdsale is Crowdsale {

    address public whitelistAddr;

    modifier onlyWhiteListed(address _beneficiary) {
        require(WhiteList(whitelistAddr).isWhiteListed(msg.sender) && _beneficiary == msg.sender);
        _;
    }

    function WhiteListedCrowdsale(address _whiteListAddr) public {
        whitelistAddr = _whiteListAddr;
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public onlyWhiteListed(beneficiary) payable {
        super.buyTokens(beneficiary);
    }
}
