export default function mergeDataToPath(data, path) {
	if (typeof path === 'string') {
		const result = {};
		let localResult = result;
		const keys = path.split('.');
		keys.forEach((key, i) => {
			if (i === keys.length - 1) {
				localResult[key] = data;
			} else {
				localResult[key] = {};
				localResult = localResult[key];
			}
		});
		return result;
	} else if (path instanceof Array && data instanceof Array) {
		return data;
	}
	let result = {};
	Object.keys(path).forEach(key => {
		if (key !== '_path') {
			const pathKey = path[key];
			if (typeof pathKey === 'string') {
				const keys = pathKey.split('.');
				if (keys.length < 2) {
					result[pathKey] = data[key];
				} else {
					result[keys[0]] = mergeDataToPath(data[key], keys.slice(1).join('.'));
				}
			} else {
				result = data[key];
			}
		}
	});
	if (path._path) {
		result = mergeDataToPath(result, path._path);
	}
	return result;
}
