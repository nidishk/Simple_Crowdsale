import mockEther from './helpers/mockEther'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const RefundableCrowdsale = artifacts.require('./helpers/RefundableCrowdsaleImpl.sol')
const Token = artifacts.require('./token/Token.sol');
const MultisigWallet = artifacts.require('./multisig/solidity/MultiSigWalletWithDailyLimit.sol');

contract('RefundableCrowdsale', function ([_, owner, investor]) {

  const rate = new BigNumber(1000)
  const goal = mockEther(800)
  const lessThanGoal = mockEther(750)
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
    this.crowdsale = await RefundableCrowdsale.new(this.startTime, this.endTime, this.rate, this.token.address, this.multisigWallet.address, goal, {from: owner})
    await this.token.transferOwnership(this.crowdsale.address);
  })

  describe('creating a valid crowdsale', function () {

    it('should fail with zero goal', async function () {
      await RefundableCrowdsale.new(this.startTime, this.endTime, this.rate, this.token.address, this.multisigWallet.address, 0, {from: owner}).should.be.rejectedWith(EVMThrow);
    })

  });

  it('should deny refunds before end', async function () {
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
    await increaseTimeTo(this.startTime)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should deny refunds after end if goal was reached', async function () {
    await increaseTimeTo(this.startTime)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await increaseTimeTo(this.endTime + 1)
    await this.crowdsale.finalize({from: owner})
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should allow refunds after end if goal was not reached', async function () {
    await increaseTimeTo(this.startTime)
    await this.crowdsale.sendTransaction({value: lessThanGoal, from: investor})
    await increaseTimeTo(this.endTime + 1)

    await this.crowdsale.finalize({from: owner})

    const pre = web3.eth.getBalance(investor)
    await this.crowdsale.claimRefund({from: investor, gasPrice: 0})
			.should.be.fulfilled
    const post = web3.eth.getBalance(investor)

    post.minus(pre).should.be.bignumber.equal(lessThanGoal)
  })

  it('should forward funds to wallet after end if goal was reached', async function () {
    await increaseTimeTo(this.startTime)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await increaseTimeTo(this.endTime + 1)

    const pre = web3.eth.getBalance(this.multisigWallet.address)
    await this.crowdsale.finalize({from: owner})
    const post = web3.eth.getBalance(this.multisigWallet.address)

    post.minus(pre).should.be.bignumber.equal(goal)
  })

})
