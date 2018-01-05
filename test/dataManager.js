const DataManager = artifacts.require('./helpers/MockDataManager.sol');
const DataCentre = artifacts.require('./token/DataCentre.sol');
const BigNumber = require('bignumber.js');
const assertJump = require('./helpers/assertJump');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing

contract('DataManager', (accounts) => {
  let dataManager;
  let dataCentre;

  beforeEach(async () => {
    dataCentre = await DataCentre.new();
    dataManager = await DataManager.new(dataCentre.address);
    await dataCentre.transferOwnership(dataManager.address);
  });

  it('should allow owner to setState', async () => {

    await dataManager.setState(true);
    const state = await dataManager.getState.call();

    assert.equal(state, true);
  });

  it('should allow owner to setOwner', async () => {

    await dataManager.setOwner(accounts[0]);
    const owner = await dataManager.getOwner.call();

    assert.equal(owner, accounts[0]);
  });

})
