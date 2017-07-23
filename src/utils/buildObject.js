/* @flow */
import { isNumber, toMaybeNumber } from './normolizeSetPath';

export default function buildObject(
	array: Array<*>,
	stringToNumber: boolean,
	value: Object|Array<*>
) {
	let localValue;
	if (isNumber(array[0], stringToNumber)) {
		localValue = [];
	} else {
		localValue = {};
	}
	let localPath = localValue;
	array.forEach((propName, key, arr) => {
		const localPropName = toMaybeNumber(propName, stringToNumber);
		if (isNumber(arr[key + 1], stringToNumber)) {
			localPath[localPropName] = [];
		} else {
			localPath[localPropName] = {};
		}
		if (key === arr.length - 1) {
			localPath[localPropName] = value;
		}
		localPath = localPath[localPropName];
	});
	return localValue;
}
