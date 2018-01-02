const Controller = artifacts.require('./controller/Controller.sol');
const MockWallet = artifacts.require('./mocks/MockWallet.sol');
const Token = artifacts.require('./token/Token.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];

contract('Controller', (accounts) => {
  let token;
  let multisigWallet;
  let crowdsale;
  let controller;

  beforeEach(async () => {
    await advanceBlock();
    const startTime = latestTime();
    token = await Token.new();
    controller = await Controller.new(token.address, '0x00')
    await token.transferOwnership(controller.address);
    await controller.unpause();
  });

  it('should allow start Minting after stopping', async () => {
  await controller.finishMinting();
  await controller.startMinting();
  const mintStatus = await controller.mintingFinished.call();
  assert.equal(mintStatus, false);
  });

  it('should allow to set new contracts', async () => {
  await controller.pause();
  const dataCentre = await DataCentre.new();
  token = await Token.new();
  await dataCentre.transferOwnership(controller.address);
  await controller.setContracts(token.address, dataCentre.address);
  const dataCentreSet = await controller.dataCentreAddr.call();
  assert.equal(dataCentreSet, dataCentre.address);
  });

  it('should allow to kill', async () => {
  await controller.pause();
  const dataCentreOld = await controller.dataCentreAddr.call();
  const controllerNew = await Controller.new(token.address, dataCentreOld);
  await controller.kill(controllerNew.address);
  const dataCentreSet = await controllerNew.dataCentreAddr.call();
  const tokenSet = await controllerNew.satellite.call();
  assert.equal(dataCentreSet, dataCentreOld);
  assert.equal(tokenSet, token.address);
  });
});
