const Crowdsale = artifacts.require('./crowdsale/singlestage/Crowdsale.sol');
const MockWallet = artifacts.require('./mocks/MockWallet.sol');
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

contract('Crowdsale', (accounts) => {
  let token;
  let endTime;
  let rate
  let startTime;
  let multisigWallet;
  let crowdsale;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    endTime = startTime + 86400*5;
    rate = 500;
    token = await Token.new();
    multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    crowdsale = await Crowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address);
    await token.transferOwnership(crowdsale.address);
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
    const tokenAddress = await crowdsale.tokenAddr.call();
    const walletAddress = await crowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, multisigWallet.address, 'address for multisig wallet in contract not set');

    //list rate and check
    const rate = await crowdsale.rate.call();
    const endTime = await crowdsale.endTime.call();

    assert.equal(endTime.toNumber(), endTime, 'endTime not set right');
    assert.equal(rate.toNumber(), rate, 'rate not set right');

    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start crowdsale if endTime smaller than startTime',  async () => {
      let crowdsaleNew;
      endTime = startTime - 1;
      try {
        crowdsaleNew = await Crowdsale.new(startTime, endTime, rate, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale due to ZERO rate',  async () => {
      let crowdsaleNew;
      try {
        crowdsaleNew = await Crowdsale.new(startTime, endTime, 0, token.address, multisigWallet.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertJump(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

  });


  describe('#purchase', () => {
    it('should allow investors to buy tokens at the constant swapRate', async () => {
      const INVESTOR = accounts[4];

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalance = await web3.eth.getBalance(multisigWallet.address);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rate);
      assert.equal(walletBalance.toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });
});
