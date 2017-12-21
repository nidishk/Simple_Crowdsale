const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

import mockEther from './helpers/mockEther'
import EVMThrow from './helpers/EVMThrow'

const RefundVault = artifacts.require('RefundVault')
const MockWallet = artifacts.require('./mocks/MockWallet.sol');

contract('RefundVault', function ([_, owner, wallet, investor]) {

  const value = mockEther(42)

  beforeEach(async function () {
    this.vault = await RefundVault.new(wallet, {from: owner})
  })


  it('should accept contributions', async function () {
    await this.vault.deposit(investor, {value, from: owner}).should.be.fulfilled
  })

  it('should not refund contribution during active state', async function () {
    await this.vault.deposit(investor, {value, from: owner})
    await this.vault.refund(investor).should.be.rejectedWith(EVMThrow)
  })

  it('only owner can enter refund mode', async function () {
    await this.vault.enableRefunds({from: _}).should.be.rejectedWith(EVMThrow)
    await this.vault.enableRefunds({from: owner}).should.be.fulfilled
  })

  it('should refund contribution after entering refund mode', async function () {
    await this.vault.deposit(investor, {value, from: owner})
    await this.vault.enableRefunds({from: owner})

    const pre = web3.eth.getBalance(investor)
    await this.vault.refund(investor)
    const post = web3.eth.getBalance(investor)

    post.minus(pre).should.be.bignumber.equal(value)
  })

  it('only owner can close', async function () {
    await this.vault.close({from: _}).should.be.rejectedWith(EVMThrow)
    await this.vault.close({from: owner}).should.be.fulfilled
  })

  it('owner cant close when wallet payable consumes too much gas', async function () {
    const walletNew = await MockWallet.new();
    this.vault = await RefundVault.new(walletNew.address, {from: owner})
    await this.vault.close({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('should forward funds to wallet after closing', async function () {
    await this.vault.deposit(investor, {value, from: owner})

    const pre = web3.eth.getBalance(wallet)
    await this.vault.close({from: owner})
    const post = web3.eth.getBalance(wallet)

    post.minus(pre).should.be.bignumber.equal(value)
  })

  it('should not deploy refund vault without wallet address', async function () {
    await RefundVault.new('0x00', {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('should not allow to enableRefunds when state not active', async function () {
    await this.vault.enableRefunds({from: owner}).should.be.fulfilled
    await this.vault.enableRefunds({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('should not accept contributions when state not active', async function () {
    await this.vault.enableRefunds({from: owner}).should.be.fulfilled
    await this.vault.deposit(investor, {value, from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('should not accept contributions when state not active', async function () {
    await this.vault.enableRefunds({from: owner}).should.be.fulfilled
    await this.vault.close({from: owner}).should.be.rejectedWith(EVMThrow)
  })
})
