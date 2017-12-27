import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const FinalizableCrowdsale = artifacts.require('./helpers/FinalizableCrowdsaleImpl.sol')
const Token = artifacts.require('./token/Token.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');

contract('FinalizableCrowdsale', function ([_, owner, wallet, thirdparty]) {

  const FOUNDERS = [web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3]];
  const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing


  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1)
    this.endTime = this.startTime + 86400*5;
    this.rate = 500;
    this.multisigWallet = await MultisigWallet.new(FOUNDERS, 3, 10*MOCK_ONE_ETH);
    this.token = await Token.new();
    this.crowdsale = await FinalizableCrowdsale.new(this.startTime, this.endTime, this.rate, this.token.address, this.multisigWallet.address, {from: owner})
    await this.token.transferOwnership(this.crowdsale.address);

  })

  it('cannot be finalized before ending', async function () {
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('cannot be finalized by third party after ending', async function () {
    await increaseTimeTo(this.endTime + 1)
    await this.crowdsale.finalize({from: thirdparty}).should.be.rejectedWith(EVMThrow)
  })

  it('can be finalized by owner after ending', async function () {
    await increaseTimeTo(this.endTime + 1)
    await this.crowdsale.finalize({from: owner}).should.be.fulfilled
  })

  it('cannot be finalized twice', async function () {
    await increaseTimeTo(this.endTime + 1)
    await this.crowdsale.finalize({from: owner})
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('logs finalized', async function () {
    await increaseTimeTo(this.endTime + 1)
    const {logs} = await this.crowdsale.finalize({from: owner})
    const event = logs.find(e => e.event === 'Finalized')
    should.exist(event)
  })

})
