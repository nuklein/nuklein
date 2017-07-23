/* @flow */
import { Map as IMap, List, OrderedMap } from 'immutable';
import Fragment from '../fragment';

function myForEach(
	data: IMap<*, *>|OrderedMap <*, *>|List <*>,
	cb: (fragm: Fragment, keys: Array < string | number >) => any,
	keys: Array < string | number >,
	localKeys: Array <string>
) {
	const localData = localKeys.length > 0 ? data.getIn(localKeys) : data;

	if (localData) {
		if (localData instanceof Fragment) {
			cb(localData, keys);
			myForEach(localData.data, cb, keys, []);
			return;
		}

		localData.forEach((v, key) => {
			if (v instanceof Fragment) {
				cb(v, keys.concat(key));
				myForEach(v.data, cb, keys.concat(key), []);
				return;
			}

			if (typeof v === 'object') {
				myForEach(data, cb, keys.concat(key), localKeys.concat(`${key}`));
			}

			return;
		});
	}
}

export default function forEachDeep(
	data: IMap<*, *>|OrderedMap <*, *>|List <*>,
	cb: (fragm: Fragment, keys: Array < string | number >) => any
) {
	myForEach(data, cb, [], []);
}
