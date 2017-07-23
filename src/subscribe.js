// @flow
import { Iterable, fromJS, is } from 'immutable';
import type { SubscribeParams } from './types/SubscribeParams';

function schemaFromJS(getStore, props, schema) {
	if (schema && typeof schema === 'function') {
		return fromJS(schema(getStore, props), (key, value) => {
			const isIndexed = Iterable.isIndexed(value);
			return isIndexed ? value.toList() : value.toOrderedMap();
		});
	}
	return undefined;
}

export default function subscribe(params: SubscribeParams) {
	const {
		store,
		schema,
		callback,
		getProps = () => undefined,
		component,
		server,
		before,
		after,
	} = params;

	const componentOrServer = component || server;

	const { setStore, getStore } = store;

	if (before && typeof before === 'function') {
		const newValue = before(getStore, componentOrServer, getProps(), 'init');
		if (newValue) {
			setStore(newValue, undefined, componentOrServer);
		}
	}

	if (schema && typeof schema === 'function') {
		const { stream } = store;

		callback(schema(getStore, getProps()));

		if (after && typeof after === 'function') {
			after(getStore, componentOrServer, getProps(), 'init');
		}

		const streamDiff = (prev, next) => {
			setTimeout(() => {
				if (!is(prev, next)) {
					if (schema && typeof schema === 'function') {
						callback(schema(getStore, getProps()));
					}

					if (after && typeof after === 'function') {
						after(getStore, componentOrServer, getProps(), 'changeStore');
					}
				}
			}, 0);
			return false;
		};

		const streamOnValue = () => undefined;

		const localStream = stream
		.map(() => schemaFromJS(getStore, getProps(), schema))
		.diff(streamDiff, schemaFromJS(getStore, getProps(), schema))
		.onValue(streamOnValue);

		const unsubscribe = () => {
			localStream.offValue(streamOnValue);
			return {
				stream: localStream,
				subscribe: () => {
					if (before && typeof before === 'function') {
						const newValue = before(getStore, componentOrServer, getProps(), 'resubscribe');
						if (newValue) {
							setStore(newValue, undefined, componentOrServer);
						}
					}
					callback(schema(getStore, getProps()));
					localStream.onValue(streamOnValue);
					if (after && typeof after === 'function') {
						after(getStore, componentOrServer, getProps(), 'resubscribe');
					}
					return {
						stream: localStream,
						unsubscribe,
					};
				},
			};
		};

		return {
			stream: localStream,
			unsubscribe,
		};
	}
	return null;
}
