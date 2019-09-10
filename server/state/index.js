const { List } = require('immutable')

const smartContractSchema = {
	smartContract: val => typeof val === 'string',
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
			errors.push(new Error(`${property} is missing or invalid.`))
		}
		return errors
	}, [])

let smartContracts
const initSmartContracts = () => {
	smartContracts = List()
}
initSmartContracts()

const addSmartContract = smartContractObj => {
	const invalidFields = findInvalidSmartContractFields(smartContractObj)
	if (invalidFields.length > 0) return invalidFields.join(' ')

	smartContracts = smartContracts.push(smartContractObj)
}

const getSmartContracts = () => {
	return smartContracts.toArray()
}

module.exports = { getSmartContracts, addSmartContract, initSmartContracts }
