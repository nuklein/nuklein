// @flow
/* eslint import/prefer-default-export: 0 */
import Store from '../store';

export type SubscribeParams = {
	store: Store;
	schema?: Function;
	callback: Function;
	getProps?: Function;
	component?: Function;
	server?: {
		name: string;
	};
	before?: Function;
	after?: Function;
};
