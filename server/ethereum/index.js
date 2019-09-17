const Web3 = require('web3')
const ipfsWrapper = require('../ipfs')
const node = ipfsWrapper({
  host: process.env.IPFS_NODE_HOST ? process.env.IPFS_NODE_HOST : 'localhost',
  port: process.env.IPFS_NODE_PORT ? process.env.IPFS_NODE_PORT : '5001',
  protocol: process.env.IPFS_NODE_PROTOCOL
    ? process.env.IPFS_NODE_PROTOCOL
    : 'http',
  headers: null
})

const web3 = new Web3(
  new Web3.providers.WebsocketProvider('ws://localhost:8545')
)

const getContract = smartContractObj => {
  return new web3.eth.Contract(smartContractObj.abi, smartContractObj.address)
}

const registerWatcher = contract => {
  return contract.events.PinHash({}, async (err, event) => {
    console.log('YOOOO', event)
    if (err) console.error('Error subscribing: ', err)

    try {
      const result = await node.getAndPin(event.returnValues.cid)
      if (!result[0]) throw new Error('no result found')
      console.log('YOOOO WE GOT A RESULT', result)
      return result
    } catch (error) {
      console.log('there was an error getting and pinning file: ', error)
      throw new Error(error)
    }
  })
}

module.exports = { registerWatcher, getContract }