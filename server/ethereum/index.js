const Web3 = require('web3')
const { ListenerContractToPoll, SmartContractToPoll, Pin } = require('../db')
const { provider } = require('./provider')
const Scheduler = require('../scheduler')
const emptyScheduler = require('../scheduler/emptyScheduler')
const {
  LISTENER_CONTRACT_ABI,
  STORAGE_CONTRACT_ABI,
  CONTRACT_POLL_INTERVAL,
  BLOCK_PADDING
} = require('../constants')

require('dotenv').config()
const web3 = new Web3(new Web3.providers.HttpProvider(provider))

const getContract = smartContractObj => {
  return new web3.eth.Contract(smartContractObj.abi, smartContractObj.address)
}

const handlePinHashEvent = event => {
  console.log(
    `Request to pin ${event.returnValues.cid} received from contract ${event.address}`
  )
  return Pin.deleteMany({ cid: event.returnValues.cid })
}

const handleListenEvent = async ({ event, returnValues }) => {
  if (event === 'Listen') {
    console.log(`Added contract ${returnValues.contractAddress} to listen to`)
    return SmartContractToPoll.create({
      address: returnValues.contractAddress,
      lastPolledBlock: 0,
      sizeOfPinnedData: 0
    })
  } else if (event === 'StopListening') {
    console.log(
      'No longer listening to smart contract at ',
      returnValues.contract
    )
    return SmartContractToPoll.deleteOne({
      address: returnValues.contractAddress
    })
  }
}

const registerPinWatcher = () =>
  new Scheduler(async () => {
    const latestBlock = (await web3.eth.getBlockNumber()) - BLOCK_PADDING
    const contractsToPoll = await SmartContractToPoll.find({})
    await Promise.all(
      contractsToPoll.map(async contract => {
        const web3Contract = new web3.eth.Contract(
          STORAGE_CONTRACT_ABI,
          contract.address
        )

        // mostly for test suites - make sure we are gathering information from new blocks
        if (latestBlock - contract.lastPolledBlock > 0) {
          const events = await web3Contract.getPastEvents('PinHash', {
            fromBlock:
              contract.lastPolledBlock === 0 ? 0 : contract.lastPolledBlock + 1,
            toBlock: latestBlock
          })
          await Promise.all(events.map(handlePinHashEvent))
          await contract.update({ lastPolledBlock: latestBlock })
        }
      })
    )
  }, CONTRACT_POLL_INTERVAL)

const registerListenWatcher = address => {
  if (address) {
    ListenerContractToPoll.create({
      address,
      lastPolledBlock: 0
    })

    return new Scheduler(async () => {
      const latestBlock = (await web3.eth.getBlockNumber()) - BLOCK_PADDING
      const contractsToPoll = await ListenerContractToPoll.find({})
      await Promise.all(
        contractsToPoll.map(async contract => {
          const web3Contract = new web3.eth.Contract(
            LISTENER_CONTRACT_ABI,
            contract.address
          )
          // mostly for test suites - make sure we are gathering information from new blocks
          if (latestBlock - contract.lastPolledBlock > 0) {
            const events = await web3Contract.getPastEvents('allEvents', {
              fromBlock:
                contract.lastPolledBlock === 0
                  ? 0
                  : contract.lastPolledBlock + 1,
              toBlock: latestBlock
            })
            await Promise.all(events.map(handleListenEvent))
            await contract.update({ lastPolledBlock: latestBlock })
          }
        })
      )
    }, CONTRACT_POLL_INTERVAL)
  }

  return emptyScheduler
}

module.exports = {
  registerPinWatcher,
  registerListenWatcher,
  getContract,
  handleListenEvent,
  handlePinHashEvent,
  web3
}
