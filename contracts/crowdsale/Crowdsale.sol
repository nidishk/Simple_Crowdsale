pragma solidity ^0.4.11;

import '../token/Token.sol';
import '../SafeMath.sol';

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract Crowdsale {
  using SafeMath for uint256;

  struct Rate {
    uint256 end;
    uint256 swapRate;
  }

  // The token being sold
  Token public token;

  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  address public wallet;

  // how many token units a buyer gets per wei
  Rate[15] internal rate;

  uint256 public weiRaised;
  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);


  function Crowdsale(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _tokenAddr, address _wallet) public {
    require(_wallet != address(0));
    require(_ends.length == _swapRate.length);
    require(_ends[0] > _startTime);

    token = Token(_tokenAddr);
    wallet = _wallet;
    startTime = _startTime;
    endTime = _ends[_ends.length - 1];

    for(uint8 i = 0; i < _ends.length; i++) {
      require(_swapRate[i] > 0);
      if (i != 0) require(_ends[i] > _ends[i-1]);
      rate[i].end = _ends[i];
      rate[i].swapRate = _swapRate[i];
    }
  }

  function currentRate() public constant returns (uint256) {
    if(now < startTime) return  0;

    for(uint8 i = 0; i < rate.length; i++) {
      if(now < rate[i].end) {
        return rate[i].swapRate;
      }
    }
  }

  // fallback function can be used to buy tokens
  function () payable {
    buyTokens(msg.sender);
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(currentRate());

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() internal {
    require(wallet.call.gas(2000).value(msg.value)());
  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal constant returns (bool) {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool nonZeroPurchase = msg.value != 0;
    return withinPeriod && nonZeroPurchase;
  }

  // @return true if crowdsale event has ended
  function hasEnded() public constant returns (bool) {
    return now > endTime;
  }

}
