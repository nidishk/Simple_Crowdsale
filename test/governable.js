const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

import mockEther from './helpers/mockEther'
import EVMThrow from './helpers/EVMThrow'

const Governable = artifacts.require('Governable')

contract('Governable', function (accounts) {

  beforeEach(async function () {
    this.governable = await Governable.new({from: accounts[0]})
  })


  it('should not allow to add admin by non admin', async function () {
    await this.governable.addAdmin(accounts[1], {from: accounts[1]}).should.be.rejectedWith(EVMThrow)
  })

  it('should not allow to add admin by if already admin', async function () {
    await this.governable.addAdmin(accounts[0], {from: accounts[0]}).should.be.rejectedWith(EVMThrow)
  })

  it('should not allow to remove non admi', async function () {
    await this.governable.removeAdmin(accounts[1], {from: accounts[0]}).should.be.rejectedWith(EVMThrow)
  })

  it('should not allow to add more than 10 admins', async function () {
    await this.governable.addAdmin(accounts[1], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[2], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[3], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[4], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[5], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[6], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[7], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[8], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[9], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin("0x06ec11c59c1af941cde8f9d89fe6765199f41d09", {from: accounts[0]}).should.be.rejectedWith(EVMThrow)
  })

  it('should allow to add and remove admin by admin', async function () {
    await this.governable.addAdmin(accounts[1], {from: accounts[0]}).should.be.fulfilled
    await this.governable.addAdmin(accounts[2], {from: accounts[0]}).should.be.fulfilled

    await this.governable.removeAdmin(accounts[1], {from: accounts[0]}).should.be.fulfilled
    await this.governable.removeAdmin(accounts[2], {from: accounts[0]}).should.be.fulfilled
  })
})
