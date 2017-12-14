export default function mockEther(n) {
  return new web3.BigNumber(web3.toWei(n/1000000, 'ether'))
}
