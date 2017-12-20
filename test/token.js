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

  beforeEach(async () => {
    await advanceBlock();
    const startTime = latestTime();
    token = await Token.new();
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

      await token.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
        const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
        assert.equal(tokenBalanceTransfered.toNumber(), 0, 'tokens transferred');
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
      } catch(error) {
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

      await token.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});
      } catch(error) {
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

      await token.pause();

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
})
