const Controller = artifacts.require('./controller/Controller.sol');
const TokenCappedCrowdsale = artifacts.require('./mocks/MockMultiStageTokenCappedCrowdsale.sol');
const Token = artifacts.require('./token/Token.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('MultiStageTokenCappedCrowdsale', (accounts) => {
  let token;
  let dataCentre;
  let ends;
  let rates;
  let capTimes;
  let caps;
  let startTime;
  let multisigWallet;
  let tokenCappedCrowdsale;
  let controller;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    capTimes = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    rates = [500, 400, 300, 200, 100];

    ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    caps = [900000e18, 900000e18, 900000e18, 900000e18, 900000e18];

    token = await Token.new();
    dataCentre = await DataCentre.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    controller = await Controller.new(token.address, dataCentre.address)
    tokenCappedCrowdsale = await TokenCappedCrowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address, capTimes, caps);
    await controller.addAdmin(tokenCappedCrowdsale.address);
    await token.transferOwnership(controller.address);
    await dataCentre.transferOwnership(controller.address);
    await controller.unpause();
    await controller.mint(accounts[0], 28350000e18);
  });

  it('should not allow investors to buy when beneficiary is address(0)', async () => {
    const INVESTORS = accounts[4];
    const amountEth = new BigNumber(((caps[0]/1e18)/rates[0]) - 1).mul(MOCK_ONE_ETH);

    //  buy tokens
    try {
      await tokenCappedCrowdsale.buyTokens('0x00', {value: amountEth, from: INVESTORS});
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
    const walletBalance = await web3.eth.getBalance(multisigWallet.address);
    const balanceInvestor = await token.balanceOf.call(INVESTORS);
    const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(0);
    const totalSupplyToken = await token.totalSupply.call();

    assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
    assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
    assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance not added to totalSupply');
  });

  it('should allow not investors to buy tokens after endTime', async () => {
    const INVESTOR = accounts[4];
    await increaseTime(ends[4] - startTime + 1);

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
    const tokenAddress = await controller.satellite.call();
    const walletAddress = await tokenCappedCrowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    // list caps and check
    const softCap = await tokenCappedCrowdsale.listCaps.call();
    softCap[1].splice(caps.length);
    softCap[0].splice(caps.length);

    assert.equal(softCap[0][0].toNumber(), capTimes[0], 'endTime not set right');
    assert.equal(softCap[0][1].toNumber(), capTimes[1], 'endTime not set right');
    assert.equal(softCap[0][2].toNumber(), capTimes[2], 'endTime not set right');
    assert.equal(softCap[0][3].toNumber(), capTimes[3], 'endTime not set right');
    assert.equal(softCap[0][4].toNumber(), capTimes[4], 'endTime not set right');

    assert.equal(softCap[1][0].toNumber(), caps[0], 'swapRate not set right');
    assert.equal(softCap[1][1].toNumber(), caps[1], 'swapRate not set right');
    assert.equal(softCap[1][2].toNumber(), caps[2], 'swapRate not set right');
    assert.equal(softCap[1][3].toNumber(), caps[3], 'swapRate not set right');
    assert.equal(softCap[1][4].toNumber(), caps[4], 'swapRate not set right');
    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start crowdsale if wallet address is address(0)',  async () => {
      let crowdsaleNew;
      try {
        crowdsaleNew = await TokenCappedCrowdsale.new(startTime, ends, rates, '0x00', controller.address, capTimes, caps);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale due to softCap length mismatch',  async () => {
      let crowdsaleNew;
      capTimes = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4];
      caps = [900000e18, 900000e18, 900000e18, 900000e18, 900000e18];
      try {
        crowdsaleNew = await TokenCappedCrowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address, capTimes, caps);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if first cap time smaller than startTime',  async () => {
      let crowdsaleNew;
      capTimes = [startTime - 100, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      caps = [900000e18, 900000e18, 900000e18, 900000e18, 900000e18];
      try {
        crowdsaleNew = await TokenCappedCrowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address, capTimes, caps);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if any cap is equal to zero',  async () => {
      let crowdsaleNew;
      capTimes = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      caps = [900000e18, 900000e18, 900000e18, 900000e18, 0];
      try {
        crowdsaleNew = await TokenCappedCrowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address, capTimes, caps);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if succesive endTimes not in ascending order',  async () => {
      let crowdsaleNew;
      capTimes = [startTime + 86400, startTime + 86400*3, startTime + 86400*2, startTime + 86400*4, startTime + 86400*5];
      caps = [900000e18, 900000e18, 900000e18, 900000e18, 0];
      try {
        crowdsaleNew = await TokenCappedCrowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address, capTimes, caps);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });
  });


  describe('#purchaseBelowCaps', () => {

    beforeEach(async () => {
      await tokenCappedCrowdsale.diluteCaps();
    });

    it('should allow investors to buy tokens just below softCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[0]/1e18)/rates[0]) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[0]).mul(amountEth);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(0);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just below softCap in the 2nd phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[1]/1e18)/rates[1]) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[1]).mul(amountEth);

      await increaseTime(capTimes[0] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(1);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just below softCap in the 3rd phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[2]/1e18)/rates[2]) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[2]).mul(amountEth);

      await increaseTime(capTimes[1] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(2);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just below softCap in the 4th phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[3]/1e18)/rates[3]) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[3]).mul(amountEth);

      await increaseTime(capTimes[2] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(3);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just below softCap in the 5th phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[4]/1e18)/rates[4]) - 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[4]).mul(amountEth);

      await increaseTime(capTimes[3] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(4);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseCaps', () => {

    beforeEach(async () => {
      await tokenCappedCrowdsale.diluteCaps();
    });

    it('should allow investors to buy tokens just equal to softCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[0]/1e18)/rates[0])).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[0]).mul(amountEth);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(0);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just equal to softCap in the 2nd phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[1]/1e18)/rates[1])).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[1]).mul(amountEth);

      await increaseTime(capTimes[0] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(1);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just equal to softCap in the 3rd phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[2]/1e18)/rates[2])).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[2]).mul(amountEth);

      await increaseTime(capTimes[1] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(2);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just equal to softCap in the 4th phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[3]/1e18)/rates[3])).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[3]).mul(amountEth);

      await increaseTime(capTimes[2] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(3);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });

    it('should allow investors to buy tokens just equal to softCap in the 5th phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[4]/1e18)/rates[4])).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[4]).mul(amountEth);

      await increaseTime(capTimes[3] - startTime);

      //  buy tokens
      await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(4);
      const totalSupplyToken = await token.totalSupply.call();

      assert.equal(walletBalance.toNumber(), amountEth.toNumber(), 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), tokensAmount.toNumber(), 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), tokensAmount.toNumber(), 'balance not added to totalSupply');
    });
  });

  describe('#purchaseOverCaps', () => {

    beforeEach(async () => {
      await tokenCappedCrowdsale.diluteCaps();
    });

    it('should not allow investors to buy tokens above softCap in the 1st phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[0]/1e18)/rates[0]) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[0]).mul(amountEth);

      //  buy tokens
      try {
        await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(0);
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });

    it('should not allow investors to buy tokens above softCap in the 2nd phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[1]/1e18)/rates[1]) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[1]).mul(amountEth);

      await increaseTime(capTimes[0] - startTime);

      //  buy tokens
      try {
        await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(1);
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });

    it('should not allow investors to buy tokens above softCap in the 3rd phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[2]/1e18)/rates[2]) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[2]).mul(amountEth);

      await increaseTime(capTimes[1] - startTime);

      //  buy tokens
      try {
        await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(2);
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });

    it('should not allow investors to buy tokens above softCap in the 4th phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[3]/1e18)/rates[3]) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[3]).mul(amountEth);

      await increaseTime(capTimes[2] - startTime);

      //  buy tokens
      try {
        await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(3);
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });

    it('should not allow investors to buy tokens above softCap in the 5th phase', async () => {
      const INVESTORS = accounts[4];
      const amountEth = new BigNumber(((caps[4]/1e18)/rates[4]) + 1).mul(MOCK_ONE_ETH);
      const tokensAmount = new BigNumber(rates[4]).mul(amountEth);

      await increaseTime(capTimes[3] - startTime);

      //  buy tokens
      try {
        await tokenCappedCrowdsale.buyTokens(INVESTORS, {value: amountEth, from: INVESTORS});
        assert.fail('should have failed before');
      } catch (error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const balanceInvestor = await token.balanceOf.call(INVESTORS);
      const totalSupplyPhase1 = await tokenCappedCrowdsale.milestoneTotalSupply.call(4);
      const totalSupplyToken = await token.totalSupply.call();
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(balanceInvestor.toNumber(), 0, 'balance still added for investor');
      assert.equal(totalSupplyPhase1.toNumber(), 0, 'balance still added to totalSupply');
    });
  });
});
