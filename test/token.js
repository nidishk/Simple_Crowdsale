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
  const FOUNDERS = [accounts[0], accounts[1], accounts[2]];

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

    it('should not allow minting tokens when mintingFinished', async () => {

      await token.finishMinting();
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

      await token.pause();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      try {
        await token.approve(BENEFICIARY, tokensAmount, {from: INVESTOR});
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

  describe('#security considerations', () => {
    it('should allow to transfer ownership of DataCentre contract to FOUNDERS manually', async () => {
      // pause and transfer ownership
      await token.pause();
      await token.transferDataCentreOwnership(accounts[0]);
      const dataCentreAddr = await token.dataCentreAddr.call();
      const dataCentre = DataCentre.at(dataCentreAddr);
      const newOwnerDataCentre = await dataCentre.owner.call();

      assert.equal(newOwnerDataCentre, accounts[0], 'ownership not transferred');
    });

    it('should allow to transfer ownership of DataCentre contract from FOUNDERS to DataCentre manually', async () => {
      // pause and transfer ownership
      await token.pause();
      await token.transferDataCentreOwnership(accounts[0]);
      const dataCentreAddr = await token.dataCentreAddr.call();
      const dataCentre = DataCentre.at(dataCentreAddr);
      let newOwnerDataCentre = await dataCentre.owner.call();

      assert.equal(newOwnerDataCentre, accounts[0], 'ownership not transferred');

      await dataCentre.transferOwnership(token.address);
      newOwnerDataCentre = await dataCentre.owner.call();

      assert.equal(newOwnerDataCentre, token.address, 'ownership not transferred');
    });

    it('should not allow to transfer ownership of DataCentre contract to FOUNDERS when not Paused', async () => {
      // pause and transfer ownership
      try {
        await token.transferDataCentreOwnership(accounts[0]);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }
      const dataCentreAddr = await token.dataCentreAddr.call();
      const dataCentre = DataCentre.at(dataCentreAddr);
      const newOwnerDataCentre = await dataCentre.owner.call();

      assert.equal(newOwnerDataCentre, token.address, 'ownership not transferred');
    });
  });


  describe('#upgradability', () => {
    let multisigWallet;
    let startTime;
    let ends;
    let rates;
    let capTimes;
    let caps;
    let simpleCrowdsale;

    beforeEach(async () => {
      await advanceBlock();
      startTime = latestTime();
      capTimes = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];

      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      caps = [900000e18, 900000e18, 900000e18, 900000e18, 900000e18];
      multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
      simpleCrowdsale = await SimpleCrowdsale.new(startTime, ends, rates, token.address, multisigWallet.address, capTimes, caps);
      await token.transferOwnership(simpleCrowdsale.address);
      await simpleCrowdsale.unpause();
    });

    it('should allow to upgrade token contract manually', async () => {

      const swapRate = new BigNumber(rates[0]);
      const INVESTOR = accounts[4];
      const BENEFICIARY = accounts[5];
      // buy tokens
      await simpleCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');

      // // begin the upgrade process
      await simpleCrowdsale.pause();
      await simpleCrowdsale.transferTokenOwnership(accounts[0]);
      await token.pause();
      await token.transferDataCentreOwnership(accounts[0]);

      // deploy new token contract
      const dataCentre = await DataCentre.at(await token.dataCentreAddr());
      const tokenNew = await Token.new(dataCentre.address);
      await dataCentre.transferOwnership(tokenNew.address);
      const dataCentreSet = await tokenNew.dataCentreAddr.call();
      assert.equal(dataCentreSet, dataCentre.address, 'dataCentre not set');


      // try a transfer operation in the new token contract
      await tokenNew.transfer(BENEFICIARY, tokensBalance, {from: INVESTOR});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      assert.equal(tokensBalance.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
    });
  })
})
