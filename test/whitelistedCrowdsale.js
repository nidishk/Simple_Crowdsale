import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'
import mockEther from './helpers/mockEther'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const Controller = artifacts.require('./controller/Controller.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const WhiteListedCrowdsale = artifacts.require('./helpers/WhiteListedCrowdsaleImpl.sol')
const WhiteList = artifacts.require('./crowdsale/WhiteList.sol')
const Token = artifacts.require('./token/Token.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol')

contract('WhiteListedCrowdsale', function ([_, owner, wallet, thirdparty]) {

  const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];
  const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
  const value = mockEther(42)


  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime()
    this.endTime = this.startTime + 86400*5;
    this.rate = 500;
    this.multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    this.token = await Token.new();
    this.dataCentre = await DataCentre.new();
    this.controller = await Controller.new(this.token.address, this.dataCentre.address)
    this.list = await WhiteList.new({from: owner})
    this.crowdsale = await WhiteListedCrowdsale.new(this.startTime, this.endTime, this.rate, this.multisigWallet.address, this.controller.address, this.list.address, {from: owner})
    await this.controller.addAdmin(this.crowdsale.address);
    await this.token.transferOwnership(this.controller.address);
    await this.dataCentre.transferOwnership(this.controller.address);
    await this.controller.unpause();

  })

  it('should allow only whiteListed addresses to buy tokens', async function () {
    await this.list.addWhiteListed(thirdparty, {from: owner}).should.be.fulfilled
    await this.crowdsale.buyTokens(thirdparty, {value, from: thirdparty}).should.be.fulfilled
  })

  it('should not allow non whiteListed addresses to buy tokens', async function () {
    await this.crowdsale.buyTokens(thirdparty, {value, from: thirdparty}).should.be.rejectedWith(EVMThrow)
  })

})
