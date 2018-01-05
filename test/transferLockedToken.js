const Controller = artifacts.require('./helpers/MockTransferLockedTokenControl.sol');
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
    await controller.mint(accounts[0], 2850000e18);
  });

  // only needed because of the refactor
  describe('#transfer', () => {
    it('should allow investors to transfer only after minting finished', async () => {

      await controller.finishMinting();

      const INVESTOR = accounts[0];
      const BENEFICIARY = accounts[5];
      const swapRate = new BigNumber(256);
      const tokensAmount = swapRate.mul(MOCK_ONE_ETH);

      await token.transfer(BENEFICIARY, tokensAmount, {from: INVESTOR});
      const tokenBalanceTransfered = await token.balanceOf.call(BENEFICIARY);
      assert.equal(tokensAmount.toNumber(), tokenBalanceTransfered.toNumber(), 'tokens not transferred');
    });

  });

  describe('#transferFrom', () => {
    it('should allow investors to approve and transferFrom only after minting finished', async () => {

      await controller.finishMinting();

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
  });
})
