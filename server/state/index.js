const { List } = require('immutable')

const smartContractSchema = {
  address: val => typeof val === 'string',
  network: val =>
    val &&
    (val.toLowerCase() === 'rinkeby' ||
      val.toLowerCase() === 'mainnet' ||
      val.toLowerCase() === 'localhost'),
  abi: val => typeof val === 'string'
}

const findInvalidSmartContractFields = smartContractObj =>
  Object.entries(smartContractSchema).reduce((errors, [property, validate]) => {
    if (!validate(smartContractObj[property])) {
      errors.push(`${property}`)
    }
    return errors
  }, [])

let smartContracts
const initSmartContracts = () => {
  smartContracts = List()
}

const isDuplicateSmartContract = address => {
  if (
    smartContracts.find(
      smartContractObj => smartContractObj.address === address
    )
  ) {
    return true
  } else return false
}

const addSmartContract = async smartContractObj => {
  const invalidFields = findInvalidSmartContractFields(smartContractObj)
  if (invalidFields.length > 0) {
    throw new Error(
      `the following fields are missing or invalid: ${invalidFields.join(', ')}`
    )
  }
  if (isDuplicateSmartContract(smartContractObj.address)) {
    throw new Error('already listening to the contract at this address')
  }

  smartContracts = smartContracts.push(smartContractObj)

  return
}

const getSmartContracts = () => {
  return smartContracts.toArray()
}

module.exports = { getSmartContracts, addSmartContract, initSmartContracts }
