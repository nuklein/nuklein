/* @flow */
import { fromJS } from 'immutable';
import { Fragment } from '../index';

export default (propName: string, options?: Object) => (MyFragment: typeof Fragment) =>
class ArrayDecorator extends Fragment {
	init() {
		return new MyFragment();
	}

	unshift(value?: Object) {
		if (propName) {
			const prevData = this.data.data.get(propName).toJS();
			prevData.unshift(value);
			const newData = fromJS(prevData);
			this.data.data = this.data.data.set(
				propName,
				newData
			);
		}
		return this.data;
	}

	push(value?: Object) {
		if (propName) {
			const prevData = this.data.data.get(propName).toJS();
			prevData.push(value);
			const newData = fromJS(prevData);
			this.data.data = this.data.data.set(
				propName,
				newData
			);
		}
		return this.data;
	}

	setData(
		value: Object,
		path?: string|number|Array<string|number>,
		setOptions?: any,
		info?: Object
	) {
		if (
			setOptions
			&& setOptions.method
			&& value
			&& typeof this[setOptions.method] === 'function') {
			if (options && options.include && !options.include.includes(setOptions.method)) {
				return this.original.setData(value, path, setOptions, info);
			}
			return this[setOptions.method](value);
		}
		return this.original.setData(value, path, setOptions, info);
	}
};
