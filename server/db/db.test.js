const mongoose = require('mongoose')
const { Pin, findandRemoveOldPins } = require('./')
const ipfs = require('../ipfs')

const ttl = process.env.TTL || 14
let oldDate = new Date()
oldDate.setDate(oldDate.getDate() - ttl - 1)

const demoNewPin1 = new Pin({
  size: 2000,
  cid: 'abc',
  smartContract: 'xyz',
  time: new Date()
})

const demoNewPin2 = new Pin({
  size: 2000,
  cid: 'def',
  smartContract: 'xyz',
  time: new Date()
})

const demoOldPin1 = new Pin({
  size: 2000,
  cid: 'abc',
  smartContract: 'xyz',
  time: oldDate
})

const demoOldPin2 = new Pin({
  size: 2000,
  cid: 'def',
  smartContract: 'xyz',
  time: oldDate
})

let cid1, cid2
beforeAll(async done => {
  await mongoose.connect(process.env.DB_URL || 'mongodb://localhost/test', {
    useNewUrlParser: true
  })
  await Pin.deleteMany({})

  cid1 = await ipfs.node.dag.put({ test: 'data1' })
  cid1 = cid1.toBaseEncodedString()
  cid2 = await ipfs.node.dag.put({ test: 'data2' })
  cid2 = cid2.toBaseEncodedString()

  demoNewPin1.cid = cid1
  demoOldPin1.cid = cid1
  demoOldPin2.cid = cid2
  demoNewPin2.cid = cid2
  done()
})
test('can add and retrieve well-formed pins from db', async done => {
  await demoNewPin1.save()
  const pins1 = await Pin.find({ cid: cid1 }).exec()
  expect(pins1.length > 0).toBe(true)

  await demoNewPin2.save()
  const pins2 = await Pin.find({ cid: cid2 }).exec()
  expect(pins2.length > 0).toBe(true)
  done()
})

test('can add + remove old pins from db', async done => {
  let cuttoff = new Date()
  cuttoff.setDate(cuttoff.getDate() - ttl)

  await demoOldPin1.save()
  const pins1 = await Pin.find({ cid: cid1, time: { $lt: cuttoff } }).exec()
  expect(pins1.length > 0).toBe(true)

  await demoOldPin2.save()
  const pins2 = await Pin.find({ cid: cid2, time: { $lt: cuttoff } }).exec()
  expect(pins2.length > 0).toBe(true)

  await ipfs.node.pin.add(cid1)
  await ipfs.node.pin.add(cid2)

  await findandRemoveOldPins()
  const oldPins = await Pin.find({ time: { $lt: cuttoff } })
  expect(oldPins.length).toBe(0)

  done()
})
