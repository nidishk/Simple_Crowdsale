const Controller = artifacts.require('./controller/Controller.sol');
const EthCappedCrowdsale = artifacts.require('./mocks/MockEthCappedCrowdsale.sol');
const Token = artifacts.require('./token/Token.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('EthCappedCrowdsale', (accounts) => {
  let token;
  let endTime;
  let rate;
  let hardCap;
  let startTime;
  let multisigWallet;
  let controller;
  let ethCappedCrowdsale;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    endTime = startTime + 86400*5;
    rate = 500;
    hardCap = 90000e18;
    token = await Token.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    controller = await Controller.new(token.address, '0x00')
    ethCappedCrowdsale = await EthCappedCrowdsale.new(startTime, endTime, rate, multisigWallet.address, controller.address, hardCap);
    await controller.addAdmin(ethCappedCrowdsale.address);
    await token.transferOwnership(controller.address);
    await controller.unpause();
  });

  describe('#ethCappedCrowdsaleDetails', () => {
    it('should allow start ethCappedCrowdsale properly', async () => {
    // checking startTimes
    const startTimeSet = await ethCappedCrowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking initial token distribution details
    const initialBalance = await token.balanceOf.call(accounts[0]);
    assert.equal(28350000e18, initialBalance.toNumber(), 'initialBalance for sale NOT distributed properly');

    //checking token and wallet address
    const tokenAddress = await controller.satellite.call();
    const walletAddress = await ethCappedCrowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    // list hardCap and check
    const CAP = await ethCappedCrowdsale.hardCap.call();

    assert.equal(CAP.toNumber(), hardCap, 'endTime not set right');

    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start crowdsale if hardCap is zero',  async () => {
      let crowdsaleNew;
      try {
        crowdsaleNew = await EthCappedCrowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address, 0);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });
  });

  describe('#purchaseBelowCap', () => {

    beforeEach(async () => {
      await ethCappedCrowdsale.diluteCap();
    });

    it('should allow investors to buy for ether just below hardCap', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber((hardCap/1e18) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      const totalSupplyTokenBefore = await token.totalSupply.call();
      await ethCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyTokenAfter = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyTokenAfter.sub(totalSupplyTokenBefore).toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseCap', () => {

    beforeEach(async () => {
      await ethCappedCrowdsale.diluteCap();
    });

    it('should allow investors to buy for ether just equal to hardCap', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber((hardCap/1e18)).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      const totalSupplyTokenBefore = await token.totalSupply.call();
      await ethCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyTokenAfter = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyTokenAfter.sub(totalSupplyTokenBefore).toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseOverCap', () => {

    beforeEach(async () => {
      await ethCappedCrowdsale.diluteCap();
    });

    it('should allow investors to buy for ether above hardCap', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber((hardCap/1e18) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rate).mul(amountEth);

      //  buy tokens
      const totalSupplyTokenBefore = await token.totalSupply.call();
      try {
        await ethCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyTokenAfter = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyTokenAfter.sub(totalSupplyTokenBefore).toNumber(), 0, 'balance not added to totalSupply');
    });
  });
});
