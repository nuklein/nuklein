/* @flow */
export function isNumber(v: string|number, stringToNumber: boolean) {
	if (stringToNumber) {
		return !isNaN(Number(v));
	}
	return typeof v === 'number';
}

export function toMaybeNumber(v: string|number, stringToNumber: boolean) {
	if (!stringToNumber) {
		return v;
	}
	return isNumber(v, stringToNumber) ? Number(v) : v;
}

export function toStr(v: string|number) {
	return typeof v === 'number' ? `${v}` : v;
}

export default function normolizeSetPath(
	path: string|number|Array<string|number>,
	forImmutable: boolean
) : Array<string|number> {
	switch (true) {
	case typeof path === 'number':
		return [forImmutable ? toStr(path) : path];
	case typeof path === 'string':
		return path.split('.').map(v => (forImmutable ? toStr(v) : v));
	case path instanceof Array:
		return forImmutable ? path.map(v => (forImmutable ? toStr(v) : v)) : path;
	default:
		return [];
	}
}
