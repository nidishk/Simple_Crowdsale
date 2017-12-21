const SimpleCrowdsale = artifacts.require('./helpers/MockSimpleCrowdsale.sol');
const Token = artifacts.require('./example/SimpleToken.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const ControlCentre = artifacts.require('./controlCentre/ControlCentre.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
const PRE_SALE_DAYS = 7;
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('SimpleCrowdsale', (accounts) => {
  let multisigWallet;
  let token;
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

    token = await Token.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    simpleCrowdsale = await SimpleCrowdsale.new(startTime, ends, rates, token.address, multisigWallet.address, capTimes, caps);
    await token.transferOwnership(simpleCrowdsale.address);
    await simpleCrowdsale.unpause();
  });

  it('should allow to setContracts in SimpleCrowdsale manually', async () => {
    await simpleCrowdsale.pause();

    const tokenNew = await Token.new();
    const multisigNew = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    await simpleCrowdsale.setContracts(tokenNew.address, multisigNew.address);
    assert.equal(await simpleCrowdsale.tokenAddr(), tokenNew.address, 'token contract not set');
    assert.equal(await simpleCrowdsale.wallet(), multisigNew.address, 'wallet contract not set');
  });

  it('should allow to transfer Token Ownership in SimpleCrowdsale manually', async () => {
    await simpleCrowdsale.pause();

    await simpleCrowdsale.transferTokenOwnership(multisigWallet.address);
    assert.equal(await token.owner(), multisigWallet.address, 'ownership not transferred');
  });

  it('should not allow to add and remove admins', async () => {

    await simpleCrowdsale.addAdmin(accounts[2]);
    await simpleCrowdsale.addAdmin(accounts[3]);

    assert.equal(await simpleCrowdsale.admins(1), accounts[2], 'governance not added');
    assert.equal(await simpleCrowdsale.admins(2), accounts[3], 'governance not added');

    await simpleCrowdsale.removeAdmin(accounts[2]);
    await simpleCrowdsale.removeAdmin(accounts[3]);

    try {
      await simpleCrowdsale.admins.call(1);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }

    try {
      await simpleCrowdsale.admins.call(2);
      assert.fail('should have failed before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should allow to buy Token when not Paused', async () => {
    const INVESTOR = accounts[4];

    const walletBalanceBefore = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceBefore = await token.balanceOf.call(INVESTOR);
    const tokensAmount = new BigNumber(rates[0]).mul(MOCK_ONE_ETH);

    await simpleCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

    const walletBalanceAfter = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceAfter = await token.balanceOf.call(INVESTOR);

    assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
    assert.equal(tokensBalanceAfter.sub(tokensBalanceBefore).toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
  });

  it('should not allow to setContracts when not paused', async () => {

    const tokenNew = await Token.new();
    const multisigNew = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);

    try {
      await simpleCrowdsale.setContracts(tokenNew.address, multisigNew.address);
    } catch (error) {
      assertJump(error);
    }

    assert.equal(await simpleCrowdsale.tokenAddr(), token.address, 'token contract still set');
    assert.equal(await simpleCrowdsale.wallet(), multisigWallet.address, 'wallet contract still set');
  });

  it('should not allow to transfer Token Ownership in SimpleCrowdsale manually', async () => {

    const multisigNew = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);

    try {
      await simpleCrowdsale.transferTokenOwnership(multisigNew.address);
    } catch (error) {
      assertJump(error);
    }

    assert.equal(await token.owner(), simpleCrowdsale.address, 'ownership still transferred');
  });

  it('should not allow to buy Token when Paused', async () => {
    await simpleCrowdsale.pause();

    const INVESTOR = accounts[4];
    const walletBalanceBefore = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceBefore = await token.balanceOf.call(INVESTOR);

    try {
      await simpleCrowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
    } catch (error) {
      assertJump(error);
    }

    const walletBalanceAfter = await web3.eth.getBalance(multisigWallet.address);
    const tokensBalanceAfter = await token.balanceOf.call(INVESTOR);

    assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether not deposited into the wallet');
    assert.equal(tokensBalanceAfter.sub(tokensBalanceBefore).toNumber(), 0, 'tokens not deposited into the INVESTOR balance');
  });
})
