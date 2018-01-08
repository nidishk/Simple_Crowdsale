const Controller = artifacts.require('./controller/Controller.sol');
const SimpleCrowdsale = artifacts.require('./helpers/MockSimpleCrowdsale.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
const Token = artifacts.require('./token/Token.sol');
const ERC223Receiver = artifacts.require('./helpers/ERC223ReceiverMock.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing

contract('Token', (accounts) => {
  let token;
  let dataCentre;
  let controller;
  const FOUNDERS = [accounts[0], accounts[1], accounts[2]];

  beforeEach(async () => {
    await advanceBlock();
    const startTime = latestTime();
    token = await Token.new();
    dataCentre = await DataCentre.new();
    controller = await Controller.new(token.address, dataCentre.address)
    await token.transferOwnership(controller.address);
    await dataCentre.transferOwnership(controller.address);
    await controller.unpause();
    await controller.mint(accounts[0], 2500000e18);
  });

  // only needed because of the refactor
  describe('#transfer', () => {
    it('should allow investors to transfer', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
    });

    it('should not allow investors to transfer to controller', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = controller.address;
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens not transferred');
      }
    });

    it('should not allow scammer and transfer un-owned tokens', async () => {

      const INVESTOR = accounts[0];
      const SCAMMER = accounts[4];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: SCAMMER});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens not transferred');
      }
    });

    it('should not allow transfer tokens more than balance', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      try {
        await token.transfer(INVESTOR, tokensAmount.add(10).toNumber(), {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), tokensAmount.toNumber(), 'tokens transferred');
      }
    });

    it('should not allow transfer tokens when Paused', async () => {

      await controller.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});

      try {
        await token.transfer(INVESTOR, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), tokensAmount, 'tokens transferred');
      }
    });

    it('should not allow minting tokens when mintingFinished', async () => {

      await controller.finishMinting();
      const BENEFICIARY = accounts[5];

      try {
        await token.mint(BENEFICIARY, MOCK_ONE_ETH * 1000);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens transferred');
      }
    });

    it('should not allow transfer tokens to self', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
    });

    it('should not allow transfer tokens to address(0)', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer('0x00', tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
    });

    it('should not allow transfer tokens to with zero amount', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(INVESTOR, 0, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
    });

    it('should allow transferring to a ERC223 Receiver contract', async () => {

      const INVESTOR = accounts[0];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      const receiver = await ERC223Receiver.new();
      const BENEFICIARY = receiver.address;


      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      const receiverCalled = await receiver.called.call();
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
      assert.equal(receiverCalled, true, 'tokens not transferred');
    });

    it('should not allow transferring to a non ERC223 contract', async () => {

      const INVESTOR = accounts[0];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      const receiver = await ERC223Receiver.new();
      const BENEFICIARY = token.address;

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens still transferred');
      }
    });

  });

  describe('#transferFrom', () => {
    it('should allow investors to approve and transferFrom', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});

      const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
      assert.equal(tokenBalanceAllowed.toNumber(), tokensAmount.toNumber(), 'tokens not allowed');

      await token.transferFrom(INVESTOR, BENEFICIARY, tokensAmount, {from: BENEFICIARY});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
    });

    it('should not allow investors to approve when Paused', async () => {

      await controller.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      try {
        await token.approve(INVESTOR, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
        assert.equal(tokenBalanceAllowed.toNumber(), 0, 'tokens still allowed');
      }
    });

    it('should not allow investors to approve tokens to self', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error)
        const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
        assert.equal(tokenBalanceAllowed.toNumber(), 0, 'tokens still allowed');
      }
    });

    it('should not allow transferFrom tokens more than allowed', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
      assert.equal(tokenBalanceAllowed.toNumber(), tokensAmount.toNumber(), 'tokens not allowed');
      try {
        await token.transferFrom(INVESTOR, BENEFICIARY, tokensAmount + 10, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens still transferred');
      }
    });

    it('should not allow transferFrom tokens when Paused', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await controller.pause();

      await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});
      try {
        await token.transferFrom(INVESTOR, BENEFICIARY, tokensAmount, {from: BENEFICIARY});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens still transferred');
      }
    });

    it('should not allow scammers to approve un-owned tokens', async () => {

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const SCAMMER = accounts[4];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: SCAMMER});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceAllowed = await token.allowance.call(INVESTOR, BENEFICIARY);
        assert.equal(tokenBalanceAllowed.toNumber(), 0, 'tokens still transferred');
      }
    });
  });

  describe('#upgradability', () => {
    let multisigWallet;
    let dataCentre;
    let startTime;
    let ends;
    let rates;
    let capTimes;
    let caps;
    let goal;
    let simpleCrowdsale;
    let controller;

    beforeEach(async () => {
      await advanceBlock();
      startTime = latestTime();
      rates = 500
      ends = startTime + 86400*5;
      caps = 900000e18;
      goal = 180000e18;

      token = await Token.new();
      dataCentre = await DataCentre.new();
      multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
      controller = await Controller.new(token.address, dataCentre.address)
      simpleCrowdsale = await SimpleCrowdsale.new(startTime, ends, rates, multisigWallet.address, controller.address, caps, goal);
      await controller.addAdmin(simpleCrowdsale.address);
      await token.transferOwnership(controller.address);
      await dataCentre.transferOwnership(controller.address);
      await controller.unpause();
    });

    it('should allow to upgrade controller contract manually', async () => {

      const swapRate = new BigNumber(rates);
      const INVESTOR = accounts[4];
      const BENEFICIARY = accounts[5];
      // buy tokens
      await simpleCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');

      const dataCentreAddr = await controller.dataCentreAddr.call();
      const dataCentre = await DataCentre.at(dataCentreAddr);
      // begin the upgrade process

      const controllerNew = await Controller.new(token.address, dataCentreAddr);
      await controller.pause();

      // transfer satellite and dataCentre
      await controller.kill(controllerNew.address);

      await token.transferOwnership(controllerNew.address);
      await dataCentre.transferOwnership(controllerNew.address);

      assert.equal(await controllerNew.satellite.call(), token.address, "Token address not set in controller");
      assert.equal(await controllerNew.dataCentreAddr.call(), dataCentreAddr, "Data Centre address not set in controller");
      assert.equal(await token.owner.call(), controllerNew.address, "Token ownership not transferred to controller");
      assert.equal(await dataCentre.owner.call(), controllerNew.address, "DataCentre ownership not transferred to controller");

      await controllerNew.unpause();

      const tokensBalance1 = await token.balanceOf.call(INVESTOR);
      const tokensAmount1 = swapRate.mul(MOCK_ONE_ETH);
      assert.equal(tokensBalance1.toNumber(), tokensAmount1.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });
})
