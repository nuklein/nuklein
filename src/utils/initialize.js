/* @flow */
import { Map as IMap, List, OrderedMap } from 'immutable';
import Fragment from '../fragment';
import forEachDeep from './forEachDeep';

export function initialize(
	fragment: Fragment,
	path: Array < string | number >,
	setStore: Function,
	getStore: Function
) {
	if (!fragment.initialize) {
		fragment.dispatchFragment(path, setStore, getStore);
	}
}

export function initializeFor(
	data: IMap<*, *>|OrderedMap <*, *>|List <*>,
	setStore: Function,
	getStore: Function
) {
	forEachDeep(data, (fragm, keys) => {
		if (!fragm.initialize) {
			initialize(fragm, keys, setStore, getStore);
		}
	});
}
