const ipfsWrapper = require('./')

let node
let getAndPin

beforeAll(() => {
  const ipfsWrapped = ipfsWrapper({
    host: process.env.IPFS_NODE_HOST ? process.env.IPFS_NODE_HOST : 'localhost',
    port: '5002',
    protocol: process.env.IPFS_NODE_PROTOCOL
      ? process.env.IPFS_NODE_PROTOCOL
      : 'http',
    headers: null
  })
  node = ipfsWrapped.node
  getAndPin = ipfsWrapped.getAndPin
})

beforeEach(async () => {
  let pins = await node.pin.ls()

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  await asyncForEach(pins, async item => {
    await node.pin.rm(item.hash)
  })

  pins = await node.pin.ls()
  if (pins.length > 0) throw new Error("Pins weren't removed properly.")
})

test('getAndPin gets and pins object that was added by dag.put', async done => {
  const dag = { test: 'value' }
  const cid = await node.dag.put(dag)
  const hashObj = await getAndPin(cid.toBaseEncodedString())
  expect(hashObj[0].hash).toBe(cid.toBaseEncodedString())
  done()
})
