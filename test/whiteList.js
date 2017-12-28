const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

import EVMThrow from './helpers/EVMThrow'

const WhiteList = artifacts.require('WhiteList')

contract('WhiteList', function ([_, owner, wallet, investor]) {

  beforeEach(async function () {
    this.list = await WhiteList.new({from: owner})
  })


  it('should accept whiteListing by owner', async function () {
    await this.list.addWhiteListed(investor, {from: owner}).should.be.fulfilled
  })

  it('should remove whiteListing by owner', async function () {
    await this.list.addWhiteListed(investor, {from: owner}).should.be.fulfilled
    await this.list.removeWhiteListed(investor, {from: owner}).should.be.fulfilled
  })

  it('should not allow same whiteListing twice', async function () {
    await this.list.addWhiteListed(investor, {from: owner}).should.be.fulfilled
    await this.list.addWhiteListed(investor, {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('should not allow to remove non existant whiteListee', async function () {
    await this.list.removeWhiteListed(investor, {from: owner}).should.be.rejectedWith(EVMThrow)
  })
})
