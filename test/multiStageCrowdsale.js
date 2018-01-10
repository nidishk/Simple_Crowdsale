const Controller = artifacts.require('./controller/Controller.sol');
const Crowdsale = artifacts.require('./mocks/MockMultiStageCrowdsale.sol');
const CrowdsaleTokenMilestones = artifacts.require('./mocks/MockMultiStageCrowdsaleTokenMilestons.sol');
const MockWallet = artifacts.require('./mocks/MockWallet.sol');
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

contract('MultiStageCrowdsale', (accounts) => {
  let token;
  let dataCentre;
  let ends;
  let rates
  let startTime;
  let multisigWallet;
  let crowdsale;
  let controller;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    rates = [500, 400, 300, 200, 100];
    token = await Token.new();
    dataCentre = await DataCentre.new()
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    controller = await Controller.new(token.address, dataCentre.address)
    crowdsale = await Crowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address);
    await controller.addAdmin(crowdsale.address);
    await token.transferOwnership(controller.address);
    await dataCentre.transferOwnership(controller.address);
    await controller.unpause();
    await controller.mint(accounts[0], 28350000e18);
  });

  describe('#crowdsaleDetails', () => {
    it('should allow start crowdsale properly', async () => {
    // checking startTime
    const startTimeSet = await crowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking initial token distribution details
    const initialBalance = await token.balanceOf.call(accounts[0]);
    assert.equal(28350000e18, initialBalance.toNumber(), 'initialBalance for sale NOT distributed properly');

    //checking token and wallet address
    const tokenAddress = await controller.satellite.call();
    const walletAddress = await crowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    //list rates and check
    const rate = await crowdsale.listRates.call();
    rate[1].splice(rates.length);
    rate[0].splice(rates.length);

    assert.equal(rate[0][0].toNumber(), ends[0], 'endTime1 not set right');
    assert.equal(rate[0][1].toNumber(), ends[1], 'endTime2 not set right');
    assert.equal(rate[0][2].toNumber(), ends[2], 'endTime3 not set right');
    assert.equal(rate[0][3].toNumber(), ends[3], 'endTime4 not set right');
    assert.equal(rate[0][4].toNumber(), ends[4], 'endTime5 not set right');

    assert.equal(rate[1][0].toNumber(), rates[0], 'swapRate1 not set right');
    assert.equal(rate[1][1].toNumber(), rates[1], 'swapRate2 not set right');
    assert.equal(rate[1][2].toNumber(), rates[2], 'swapRate3 not set right');
    assert.equal(rate[1][3].toNumber(), rates[3], 'swapRate4 not set right');
    assert.equal(rate[1][4].toNumber(), rates[4], 'swapRate5 not set right');
    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start crowdsale if wallet address is address(0)',  async () => {
      let crowdsaleNew;
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, '0x00', controller.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale due to rate length mismatch',  async () => {
      let crowdsaleNew;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if first end time smaller than startTime',  async () => {
      let crowdsaleNew;
      ends = [startTime - 2, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if any rate is equal to zero',  async () => {
      let crowdsaleNew;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 0];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if succesive endTimes not in ascending order',  async () => {
      let crowdsaleNew;
      ends = [startTime + 86400, startTime + 86400*3, startTime + 86400*2, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 0];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });
  });

  describe('#currentRate', () => {

    it('should return 0 rate before startTime',  async () => {
      let crowdsaleNew;
      const startTime1 = startTime + 100;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];

      crowdsaleNew = await Crowdsale.new(startTime1, ends, rates, token.address, multisigWallet.address);

      const rate = await crowdsaleNew.currentRate();
      assert.equal(rate.toNumber(), 0, 'rate return not correct');
    });

    it('should return 0 rate after endTime',  async () => {
      let crowdsaleNew;
      const startTime1 = startTime + 100;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];

      crowdsaleNew = await Crowdsale.new(startTime1, ends, rates, token.address, multisigWallet.address);

      await increaseTime(ends[4] - startTime);

      const rate = await crowdsaleNew.currentRate();
      assert.equal(rate.toNumber(), 0, 'rate return not correct');
    });
  });

  describe('#invalidPurchase', () => {

    it('should not allow investors to buy tokens if beneficiary address is address(0)', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      try {
        await crowdsale.buyTokens('0x00', {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should not allow investors to buy tokens if beneficiary address is msg.value is 0', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      try {
        await crowdsale.buyTokens('0x00', {value: 0, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should not allow investors to buy tokens if startTime not reached', async () => {
      const INVESTOR = accounts[4];
      let crowdsaleNew;
      const startTime1 = startTime + 100;
      crowdsaleNew = await Crowdsale.new(startTime1, ends, rates, token.address, multisigWallet.address);

      // buy tokens
      try {
        await crowdsale.buyTokens('0x00', {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should allow not investors to buy tokens after endTime', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[4] - startTime + 1);

      // buy tokens
      try {
        await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const walletBalance = await web3.eth.getBalance(multisigWallet.address);
        const tokensBalance = await token.balanceOf.call(INVESTOR);
        assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
        assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
      }
    });

    it('should allow not allow forward funds if wallet payable consumes a lot of gas', async () => {
      const INVESTOR = accounts[4];
      const walletNew = await MockWallet.new();
      const crowdsaleNew = await Crowdsale.new(startTime, ends, rates, walletNew.address, controller.address)
      await controller.removeAdmin(crowdsale.address);
      await controller.addAdmin(crowdsaleNew.address);

      // buy tokens
      try {
        await crowdsaleNew.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const walletBalance = await web3.eth.getBalance(multisigWallet.address);
        const tokensBalance = await token.balanceOf.call(INVESTOR);
        assert.equal(walletBalance.toNumber(), 0, 'ether still deposited into the wallet');
        assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
      }
    });
  });

  describe('#purchaseTimeMilestones', () => {
    it('should allow investors to buy tokens at the 1st swapRate', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 2nd swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[0] - startTime);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[1]);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 3rd swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[1] - startTime);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[2]);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 4th swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[2] - startTime);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[3]);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 5th swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[3] - startTime);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);


      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[4]);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at all swapRates across the crowdsales', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[0] - startTime);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[1] - ends[0]);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[2] - ends[1]);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[3] - ends[2]);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0] + rates[1] + rates[2] + rates[3] + rates[4]);
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      assert.equal(walletBalance.toNumber(), 5 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });

  describe('#tokenMilestonesRates', () => {
    let endTime;

    beforeEach(async () => {
      await advanceBlock();
      startTime = latestTime() + 40000;
      endTime = startTime + 86400;
      ends = [250e18, 490e18, 720e18, 940e18, 1150e18];
      rates = [125, 120, 115, 110, 105];
      await controller.removeAdmin(crowdsale.address);
      crowdsale = await CrowdsaleTokenMilestones.new(startTime, endTime, ends, rates, multisigWallet.address, controller.address);
      await controller.addAdmin(crowdsale.address);
      await crowdsale.diluteMilestones();
    });

    it('should return 0 rate before startTime',  async () => {
      const rate = await crowdsale.currentRate();
      assert.equal(rate.toNumber(), 0, 'rate return not correct');
    });

  });

  describe('#unsuccesfulInitialization', () => {
    let endTime;

    beforeEach(async () => {
      await advanceBlock();
      startTime = latestTime() + 40000;
      endTime = startTime + 86400;
      ends = [250e18, 490e18, 720e18, 940e18, 1150e18];
      rates = [125, 120, 115, 110, 105];
      await controller.removeAdmin(crowdsale.address);
      crowdsale = await CrowdsaleTokenMilestones.new(startTime, endTime, ends, rates, multisigWallet.address, controller.address);
      await controller.addAdmin(crowdsale.address);
      await crowdsale.diluteMilestones();
    });

    it('should not allow to start crowdsale if end time smaller than startTime',  async () => {
      let crowdsaleNew;
      endTime = startTime - 2;
      rates = [500, 400, 300, 200, 100];
      try {
        crowdsaleNew = await CrowdsaleTokenMilestones.new(startTime, endTime, ends, rates, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });
  });

  describe('#purchaseTokenMilestones', () => {
    let endTime;

    beforeEach(async () => {
      await advanceBlock();
      startTime = latestTime();
      endTime = startTime + 86400;
      ends = [250e18, 490e18, 720e18, 940e18, 1150e18];
      rates = [125, 120, 115, 110, 105];
      await controller.removeAdmin(crowdsale.address);
      crowdsale = await CrowdsaleTokenMilestones.new(startTime, endTime, ends, rates, multisigWallet.address, controller.address);
      await controller.addAdmin(crowdsale.address);
      await crowdsale.diluteMilestones();
    });

    it('should allow investors to buy tokens at the 1st swapRate', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 2nd swapRate', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[1]);
      assert.equal(walletBalance.toNumber(), 3 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 3rd swapRate', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[2]);
      assert.equal(walletBalance.toNumber(), 5 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 4th swapRate', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[3]);
      assert.equal(walletBalance.toNumber(), 7 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 5th swapRate', async () => {
      const INVESTOR = accounts[4];
      const BIGBUYER = accounts[5];

      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});
      await crowdsale.buyTokens(BIGBUYER, {value: 2 * MOCK_ONE_ETH, from: BIGBUYER});

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);


      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[4]);
      assert.equal(walletBalance.toNumber(), 9 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });
});
