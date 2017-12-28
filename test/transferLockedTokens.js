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

const Token = artifacts.require('./helpers/MockTransferLockedToken.sol')
const tokens = mockEther(42).mul(100);

contract('TransferLockedTokens', function ([_, owner, wallet, thirdparty]) {

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.token = await Token.new();
  })

  it('should allow tranfer only when minting finished', async function () {
    await this.token.finishMinting().should.be.fulfilled;
    await this.token.transfer(thirdparty, tokens).should.be.fulfilled;
  })

  it('should allow approve and transferFrom only when minting finished', async function () {
    await this.token.finishMinting().should.be.fulfilled;
    await this.token.approve(thirdparty, tokens).should.be.fulfilled;
    await this.token.transferFrom(_, thirdparty, tokens).should.be.fulfilled;
  })

  it('should not allow tranfer only when minting in progress', async function () {
    await this.token.transfer(thirdparty, tokens).should.be.rejectedWith(EVMThrow);
  })

  it('should not allow approve and transferFrom only when minting in progress', async function () {
    await this.token.approve(thirdparty, tokens).should.be.rejectedWith(EVMThrow);
  })
})
