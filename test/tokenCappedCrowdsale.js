const TokenCappedCrowdsale = artifacts.require('./mocks/MockTokenCappedCrowdsale.sol');
const Token = artifacts.require('./helpers/MockPausedToken.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('TokenCappedCrowdsale', (accounts) => {
  let token;
  let endTime;
  let rate;
  let capTimes;
  let tokenCap;
  let startTime;
  let multisigWallet;
  let tokenCappedCrowdsale;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    rate = 500;
    endTime = startTime + 86400*5;
    tokenCap = 900000e18;

    token = await Token.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    tokenCappedCrowdsale = await TokenCappedCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, tokenCap);
    await token.transferOwnership(tokenCappedCrowdsale.address);
  });

  it('should allow not investors to buy tokens after endTime', async () => {
    const INVESTOR = accounts[4];
    await increaseTime(endTime - startTime + 1);

    // buy tokens
    try {
      await tokenCappedCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      assert.equal(walletBalance.toNumber(), 0, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
    }
  });

  describe('#tokenCappedCrowdsaleDetails', () => {
    it('should allow start tokenCappedCrowdsale properly', async () => {
    // checking startTimes
    const startTimeSet = await tokenCappedCrowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking initial token distribution details
    const initialBalance = await token.balanceOf.call(accounts[0]);
    assert.equal(28350000e18, initialBalance.toNumber(), 'initialBalance for sale NOT distributed properly');

    //checking token and wallet address
    const tokenAddress = await tokenCappedCrowdsale.tokenAddr.call();
    const walletAddress = await tokenCappedCrowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    // list tokenCap and check
    const tokenCapSet = await tokenCappedCrowdsale.tokenCap.call();

    assert.equal(tokenCapSet.toNumber(), tokenCap, 'tokenCap not set');
    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start crowdsale if cap is zero',  async () => {
      let crowdsaleNew;
      try {
        tokenCappedCrowdsale = await TokenCappedCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, 0);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });
  });


  describe('#purchaseBelowCaps', () => {

    beforeEach(async () => {
      await tokenCappedCrowdsale.diluteCap();
    });

    it('should allow investors to buy tokens just below tokenCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((tokenCap/1e18)/rate) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.totalSupply.call();
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseCaps', () => {

    beforeEach(async () => {
      await tokenCappedCrowdsale.diluteCap();
    });

    it('should allow investors to buy tokens just equal to tokenCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((tokenCap/1e18)/rate)).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.totalSupply.call();
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseOverCaps', () => {

    beforeEach(async () => {
      await tokenCappedCrowdsale.diluteCap();
    });

    it('should not allow investors to buy tokens above tokenCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((tokenCap/1e18)/rate) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      try {
        await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.totalSupply.call();
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });
  });
});
