import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const Controller = artifacts.require('./controller/Controller.sol');
const EtherAllocatingCrowdsale = artifacts.require('./helpers/mocks/EtherAllocatingCrowdsaleImpl.sol')
const Token = artifacts.require('./token/Token.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const MockWallet = artifacts.require('./mocks/MockWallet.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');

contract('EtherAllocatingCrowdsale', function ([_, owner, wallet, thirdparty]) {

  const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];
  const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing


  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime();
    this.endTime = this.startTime + 86400*5;
    this.rate = 500;
    this.multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    this.token = await Token.new();
    this.dataCentre = await DataCentre.new();
    this.controller = await Controller.new(this.token.address, this.dataCentre.address)
    this.crowdsale = await EtherAllocatingCrowdsale.new(this.startTime, this.endTime, this.rate, this.multisigWallet.address, this.controller.address,  {from: owner})
    await this.controller.addAdmin(this.crowdsale.address);
    await this.token.transferOwnership(this.controller.address);
    await this.dataCentre.transferOwnership(this.controller.address);
    await this.controller.unpause();
  })

  it('should not forward funds to wallet during buy tokens', async function () {
    const balanceBefore = await web3.eth.getBalance(this.crowdsale.address);
    await this.crowdsale.buyTokens(thirdparty, {value: MOCK_ONE_ETH, from: thirdparty});
    const balanceAfter = await web3.eth.getBalance(this.crowdsale.address);

    balanceAfter.minus(balanceBefore).should.be.bignumber.equal(MOCK_ONE_ETH);
  })

  it('should finalize and forward funds to wallet', async function () {
    await this.crowdsale.buyTokens(thirdparty, {value: MOCK_ONE_ETH, from: thirdparty});

    await increaseTimeTo(this.endTime + 1)
    const balanceBefore = await web3.eth.getBalance(this.multisigWallet.address);
    await this.crowdsale.finalize({from: owner}).should.be.fulfilled
    const balanceAfter = await web3.eth.getBalance(this.multisigWallet.address);

    balanceAfter.minus(balanceBefore).should.be.bignumber.equal(MOCK_ONE_ETH);
  })

  it('should allow not allow forward funds if wallet payable consumes a lot of gas', async function () {
    this.multisigWallet = await MockWallet.new();
    await this.controller.removeAdmin(this.crowdsale.address);
    this.crowdsale = await EtherAllocatingCrowdsale.new(this.startTime, this.endTime, this.rate, this.multisigWallet.address, this.controller.address,  {from: owner})
    await this.controller.addAdmin(this.crowdsale.address);
    await this.crowdsale.buyTokens(thirdparty, {value: MOCK_ONE_ETH, from: thirdparty});
    await increaseTimeTo(this.endTime + 1)
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow);
  });


})
