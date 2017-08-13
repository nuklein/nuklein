'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _desc, _value, _class;

var _autobindDecorator = require('autobind-decorator');

var _autobindDecorator2 = _interopRequireDefault(_autobindDecorator);

var _lodash = require('lodash.isequal');

var _lodash2 = _interopRequireDefault(_lodash);

var _immutable = require('immutable');

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _getPathParse = require('./utils/getPathParse');

var _getPathParse2 = _interopRequireDefault(_getPathParse);

var _mergeDeepWith = require('./utils/mergeDeepWith');

var _mergeDeepWith2 = _interopRequireDefault(_mergeDeepWith);

var _forEachDeep = require('./utils/forEachDeep');

var _forEachDeep2 = _interopRequireDefault(_forEachDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
	var desc = {};
	Object['ke' + 'ys'](descriptor).forEach(function (key) {
		desc[key] = descriptor[key];
	});
	desc.enumerable = !!desc.enumerable;
	desc.configurable = !!desc.configurable;

	if ('value' in desc || desc.initializer) {
		desc.writable = true;
	}

	desc = decorators.slice().reverse().reduce(function (desc, decorator) {
		return decorator(target, property, desc) || desc;
	}, desc);

	if (context && desc.initializer !== void 0) {
		desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
		desc.initializer = undefined;
	}

	if (desc.initializer === void 0) {
		Object['define' + 'Property'](target, property, desc);
		desc = null;
	}

	return desc;
}

var Fragment = (_class = function () {
	/* eslint-disable react/sort-comp */
	function Fragment(props) {
		var _this = this;

		(0, _classCallCheck3.default)(this, Fragment);

		var localProps = this.beforeInit(props || {}) || {};
		this.props = localProps;

		var initialData = this.init(localProps);
		this.data = (0, _immutable.fromJS)(initialData, function (key, value) {
			var isIndexed = _immutable.Iterable.isIndexed(value);
			return isIndexed ? value.toList() : value.toOrderedMap();
		});

		this.initialize = false;
		this.getCount = 0;
		this.specificGetCount = 0;
		this.userSetData = null;
		this.path = null;
		this.mergeData = null;
		this.emptyPath = false;
		this.dataForPaths = new Map();
		this.dataNotFoundPaths = [];

		this.normalizeData = null;

		this.original = {
			setData: function setData() {
				var newData = _this._mergeData.apply(_this, arguments);

				_this.data = newData;

				_this.normalizeData = null;
				_this.dataForPaths = new Map();

				return newData;
			},
			getData: this.getData
		};
	}
	/* eslint-enable react/sort-comp */

	/* eslint-disable no-unused-vars */


	(0, _createClass3.default)(Fragment, [{
		key: 'beforeInit',
		value: function beforeInit(props) {
			return props;
		}
		/* eslint-enable no-unused-vars */

		/* eslint-disable no-unused-vars */

	}, {
		key: 'afterInit',
		value: function afterInit(props) {
			return;
		}
		/* eslint-enable no-unused-vars */

	}, {
		key: 'getDataIn',
		value: function getDataIn(store) {
			var _this2 = this;

			return function (path, specific, onDataNotFound, onDataNotFoundOne) {
				var localData = _this2.data;
				var ondf = typeof _this2.onDataNotFound === 'function' ? _this2.onDataNotFound.bind(_this2) : undefined;
				var ondfo = typeof _this2.onDataNotFoundOne === 'function' ? _this2.onDataNotFoundOne.bind(_this2) : onDataNotFoundOne;
				if (!ondf && onDataNotFound) {
					ondf = onDataNotFound;
				}
				if (store) {
					if (store instanceof Fragment || store instanceof _store2.default) {
						localData = store.data;
					} else {
						localData = (0, _immutable.fromJS)(store, function (key, value) {
							var isIndexed = _immutable.Iterable.isIndexed(value);
							return isIndexed ? value.toList() : value.toOrderedMap();
						});
					}
				}

				var value = localData;

				if (path) {
					var res = (0, _getPathParse2.default)(path, value, ondf, ondfo);
					value = res.value;
					var nfPath = res.notFoundPath;

					if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) !== 'object') {
						if ((_this2.onDataNotFoundOne || onDataNotFoundOne) && (value === undefined || value === null)) {
							var v = void 0;
							if (_this2.onDataNotFoundOne) {
								v = _this2.onDataNotFoundOne(path);
							}
							if ((v === undefined || v === null) && onDataNotFoundOne) {
								v = onDataNotFoundOne(path);
							}
							if (v !== undefined && v !== null) {
								return v;
							}
						}
						if ((value === undefined || value === null) && !_this2.dataNotFoundPaths.find(function (v) {
							return (0, _lodash2.default)(v, path);
						})) {
							_this2.dataNotFoundPaths.push(path);
							var nfValue = void 0;
							if (typeof _this2.onDataNotFound === 'function') {
								nfValue = _this2.onDataNotFound(path);
							}
							if (typeof onDataNotFound === 'function') {
								nfValue = onDataNotFound(path);
							}
							if (nfValue) {
								return nfValue;
							}
						}
						return value;
					}
					if (_immutable.Iterable.isIterable(value)) {
						if (nfPath && !_this2.dataNotFoundPaths.find(function (v) {
							return (0, _lodash2.default)(v, nfPath);
						})) {
							_this2.dataNotFoundPaths.push(nfPath);
							var _nfValue = void 0;
							if (typeof _this2.onDataNotFound === 'function') {
								_nfValue = _this2.onDataNotFound(nfPath);
							}
							if (typeof onDataNotFound === 'function') {
								_nfValue = onDataNotFound(nfPath);
							}
							if (_nfValue && value) {
								value = (0, _mergeDeepWith2.default)(value, function (prev, next, key, localPath) {
									if (next && next instanceof Fragment) {
										/*
          надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
          чтобы это точно работало правильно.
          */
										var result = void 0;
										if (next._getData && typeof next._getData === 'function') {
											result = next._getData(undefined, next.getDataIn(), specific, ondf);
											next.getCounter();
										} else {
											next.beforeGet();
											result = next.getData(undefined, next.getDataIn(), specific, ondf);
											next.getCounter();
											next.afterGet(result, undefined, specific);
										}
										return result;
									}
									if ((_this2.onDataNotFoundOne || onDataNotFoundOne) && (next === undefined || next === null) && (prev === undefined || prev === null)) {
										var _v = void 0;
										if (_this2.onDataNotFoundOne) {
											_v = _this2.onDataNotFoundOne(localPath.concat(key).join('.'));
										}
										if ((_v === undefined || _v === null) && onDataNotFoundOne) {
											_v = onDataNotFoundOne(localPath.concat(key).join('.'));
										}
										if (_v !== undefined && _v !== null) {
											return _v;
										}
									}
									if (next !== undefined && next !== null) {
										return next;
									}
									return prev;
								}, _nfValue);
							}
						}
						if (value && _immutable.Iterable.isIterable(value)) {
							value = value.toJS();
						}
					}
					return value;
				}

				if (value instanceof Fragment) {
					/*
     надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
     чтобы это точно работало правильно.
     */
					var result = void 0;
					if (value._getData && typeof value._getData === 'function') {
						result = value._getData(undefined, value.getDataIn(), undefined, ondf);
						value.getCounter();
					} else {
						value.beforeGet();
						result = value.getData(undefined, value.getDataIn(), undefined, ondf);
						value.getCounter();
						value.afterGet(result);
					}
					if ((_this2.onDataNotFoundOne || onDataNotFoundOne) && (result === undefined || result === null)) {
						var _v2 = void 0;
						if (_this2.onDataNotFoundOne) {
							_v2 = _this2.onDataNotFoundOne(path);
						}
						if ((_v2 === undefined || _v2 === null) && onDataNotFoundOne) {
							_v2 = onDataNotFoundOne(path);
						}
						if (_v2 !== undefined && _v2 !== null) {
							return _v2;
						}
					}
					return result;
				}

				if (value && value.mergeDeepWith && typeof value.mergeDeepWith === 'function') {
					value = (0, _mergeDeepWith2.default)(value, function (v, v2, key, localPath) {
						if (v && v instanceof Fragment) {
							/*
       надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
       чтобы это точно работало правильно.
       */
							var _result = void 0;
							if (v._getData && typeof v._getData === 'function') {
								_result = v._getData(undefined, v.getDataIn(), specific, ondf);
								v.getCounter();
							} else {
								v.beforeGet();
								_result = v.getData(undefined, v.getDataIn(), specific, ondf);
								v.getCounter();
								v.afterGet(_result, undefined, specific);
							}
							if ((_this2.onDataNotFoundOne || onDataNotFoundOne) && (_result === undefined || _result === null)) {
								var _v3 = void 0;
								if (_this2.onDataNotFoundOne) {
									_v3 = _this2.onDataNotFoundOne(localPath.concat(key).join('.'));
								}
								if ((_v3 === undefined || _v3 === null) && onDataNotFoundOne) {
									_v3 = onDataNotFoundOne(localPath.concat(key).join('.'));
								}
								if (_v3 !== undefined && _v3 !== null) {
									return _v3;
								}
							}
							return _result;
						}
						return v;
					}, value);

					value = value.toJS();
				}

				if ((_this2.onDataNotFoundOne || onDataNotFoundOne) && (value === undefined || value === null)) {
					var _v4 = void 0;
					if (_this2.onDataNotFoundOne) {
						_v4 = _this2.onDataNotFoundOne(path);
					}
					if ((_v4 === undefined || _v4 === null) && onDataNotFoundOne) {
						_v4 = onDataNotFoundOne(path);
					}
					if (_v4 !== undefined && _v4 !== null) {
						return _v4;
					}
				}

				return value;
			};
		}
	}, {
		key: 'beforeGet',
		value: function beforeGet(path) {
			return path;
		}
	}, {
		key: 'getData',
		value: function getData(path, getRealData, specific, onDataNotFound, onDataNotFoundOne) {
			return this.getDataIn()(this.beforeGet(path), specific, onDataNotFound, onDataNotFoundOne);
		}

		/* eslint-disable no-unused-vars */

	}, {
		key: 'afterGet',
		value: function afterGet(result, path, specific) {
			return;
		}
		/* eslint-enable no-unused-vars */

	}, {
		key: 'getCounter',
		value: function getCounter(isSpecific) {
			this.getCount++;
			if (isSpecific) {
				this.specificGetCount++;
			}
		}

		/* eslint-disable no-unused-vars */

	}, {
		key: 'beforeSet',
		value: function beforeSet(value, data, options, info) {
			return value;
		}
		/* eslint-enable no-unused-vars */

	}, {
		key: '_mergeValue',
		value: function _mergeValue(data, value, path, options, info, notInitCb, notInitFragms) {
			var _this3 = this;

			var nif = notInitFragms;
			var localData = void 0;
			if (options && (options === 'replace' || options.method === 'replace')) {
				localData = value;
			} else {
				localData = (0, _mergeDeepWith2.default)(data, function (prev, next, key, localPath) {
					var niPath = localPath.concat(key);
					if (_this3.path) {
						niPath = _this3.path.concat(niPath);
					}
					var myPath = void 0;
					if (path) {
						myPath = path.slice(localPath.concat(key).length);
					}
					if (prev && prev instanceof Fragment) {
						var localNext = next;

						if (next instanceof Fragment) {
							localNext = next.data;
						}

						var result = void 0;
						if (!localNext) {
							result = prev;
						} else {
							var newCb = void 0;
							if (notInitCb) {
								newCb = function newCb(fr) {
									nif = nif.concat(fr);
								};
							}
							result = prev._setData(localNext.toJS(), myPath, options, info, newCb);
						}

						return (0, _immutable.fromJS)(result, function (_key, val) {
							var isIndexed = _immutable.Iterable.isIndexed(val);
							return isIndexed ? val.toList() : val.toOrderedMap();
						});
					}

					/*
     надо попробовать переписать так, чтобы сразу выполнялась инциализация,
     */
					if (next instanceof Fragment && !next.initialize) {
						nif.push([next, niPath]);
					}

					if (next !== undefined && next !== null) {
						return next;
					}
					return prev;
				}, value);
			}
			return { data: localData, notInitFragms: nif };
		}
	}, {
		key: '_mergeData',
		value: function _mergeData(value, path, options, info, notInitCb) {
			var localValue = (0, _immutable.fromJS)(value, function (key, v) {
				var isIndexed = _immutable.Iterable.isIndexed(v);
				return isIndexed ? v.toList() : v.toOrderedMap();
			});

			var notInitFragms = [];
			var localData = void 0;

			if (this.data instanceof Fragment) {
				localData = this.data._setData(value, path, options, info, function (fr) {
					notInitFragms = notInitFragms.concat(fr);
				});
			} else if (path) {
				var ld = this.data;
				var immMap = [];
				var keys = [];
				var index = 0;
				path.forEach(function (key, i) {
					if (_immutable.Iterable.isIterable(ld)) {
						ld = ld.get(key);
						immMap.unshift([ld, key]);
						keys.push('' + key);
						index = i;
						return true;
					}
					return false;
				});
				if (immMap.length) {
					if (_immutable.Iterable.isIterable(immMap[0][0])) {
						if (options && (options === 'remove' || options.method === 'remove')) {
							localData = this.data.setIn(keys.slice(-1), this.data.getIn(keys.slice(-1)).delete(value));
						} else {
							var result = this._mergeValue(immMap[0][0], localValue, index > 0 ? path.slice(index - 1) : path.slice(1), options, info, notInitCb, notInitFragms);
							localData = this.data.setIn(keys, result.data);
							notInitFragms = notInitFragms.concat(result.notInitFragms);
						}
					} else if (immMap[0][0] instanceof Fragment) {
						var newPath = index > 0 ? path.slice(index - 1) : path.slice(1);
						var _result2 = immMap[0][0]._setData(value, newPath, options, info, function (fr) {
							notInitFragms = notInitFragms.concat(fr);
						});
						notInitFragms.push([immMap[0][0], newPath]);
						if (keys.length > 1) {
							localData = this.data.setIn(keys, _result2);
						} else {
							localData = this.data.set(keys[0], _result2);
						}
					} else {
						if (value instanceof Fragment) {
							notInitFragms.push([value, this.path.concat(keys)]);
						}
						if (keys.length > 1) {
							localData = this.data.setIn(keys, value);
						} else {
							localData = this.data.set(keys[0], value);
						}
					}
				} else if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
					var _result3 = this._mergeValue(this.data, localValue, path, options, info, notInitCb, notInitFragms);
					localData = _result3.data;
					notInitFragms = notInitFragms.concat(_result3.notInitFragms);
				} else {
					if (value instanceof Fragment) {
						notInitFragms.push([value, this.path]);
					}
					localData = value;
				}
			} else {
				var _result4 = this._mergeValue(this.data, localValue, path, options, info, notInitCb, notInitFragms);
				localData = _result4.data;
				notInitFragms = notInitFragms.concat(_result4.notInitFragms);
			}

			if (notInitCb) {
				notInitCb(notInitFragms);
			}

			if (localData instanceof Fragment || _immutable.List.isList(localData) || _immutable.OrderedMap.isOrderedMap(localData)) {
				return localData;
			}

			if (_immutable.Iterable.isIndexed(localData)) {
				return localData.toList();
			}
			return localData.toOrderedMap();
		}
	}, {
		key: 'dispatchFragment',
		value: function dispatchFragment(path, setStore, getStore) {
			var _this4 = this;

			if (!this.initialize) {
				this.initialize = true;
				this.path = path;

				this.getStore = getStore;

				this._afterGet = this.afterGet;

				this.afterGet = function (value, getPath, specific) {
					_this4._afterGet(value, getPath, specific, setStore);
				};

				this.userGetData = this.getData;

				this._getData = function (getPath, getRealData, specific, onDataNotFound, onDataNotFoundOne) {
					var result = void 0;
					if (!getPath) {
						if (_this4.emptyPath === false) {
							_this4.emptyPath = _this4.beforeGet(getPath);
						}
						if (_this4.normalizeData) {
							result = _this4.normalizeData;
						} else {
							result = _this4.userGetData(_this4.emptyPath, getRealData, specific, onDataNotFound, onDataNotFoundOne);
						}
						_this4.afterGet(result, _this4.emptyPath, specific);
						return result;
					}
					var newPath = _this4.beforeGet(getPath);
					if (!newPath) {
						if (_this4.normalizeData) {
							result = _this4.normalizeData;
						} else {
							result = _this4.userGetData(_this4.emptyPath, getRealData, specific, onDataNotFound, onDataNotFoundOne);
						}
					} else if (_this4.dataForPaths.has(newPath)) {
						result = _this4.dataForPaths.get(newPath);
					} else {
						result = _this4.userGetData(newPath, getRealData, specific, onDataNotFound, onDataNotFoundOne);
						_this4.dataForPaths.set(newPath, result);
					}
					_this4.afterGet(result, newPath, specific);
					return result;
				};

				this.getData = function (getPath) {
					var result = _this4._getData(getPath, _this4.getDataIn(), undefined, _this4.onDataNotFound, _this4.onDataNotFoundOne);
					_this4.getCounter();
					return result;
				};

				this.original.getData = this.getData;

				this.mergeData = function (value, localPath, options, info) {
					var res = _this4._mergeData(value, localPath, options, info);
					if (_immutable.Iterable.isIterable(res)) {
						return res.toJS();
					}
					return res;
				};

				this.userSetData = this.setData;

				this.setData = function (value, localPath, options, info) {
					var fullPath = localPath ? path.concat(localPath) : path;
					return setStore(value, fullPath, options, (0, _extends3.default)({}, info, { fragment: _this4 }));
				};

				this._afterSet = this.afterSet;

				this.afterSet = function (value, prevData, newData, _, options, info) {
					setTimeout(function () {
						_this4._afterSet(value, prevData, newData, setStore, options, info);
					}, 0);
				};

				if (this.onDataNotFound) {
					this.useronDataNotFound = this.onDataNotFound;
					this.onDataNotFound = function () {
						_this4.dataNotFoundPaths = [];
						return _this4.useronDataNotFound.apply(_this4, arguments);
					};
				}

				this.afterInit(this.props);
			}
		}
	}, {
		key: '_setData',
		value: function _setData(value, path, options, info, notInitCb) {
			var prevData = this.getData();

			var myValue = this.beforeSet(value, prevData, options, info);

			var newData = void 0;
			if (this.userSetData) {
				newData = (0, _immutable.fromJS)(this.userSetData(myValue, path, options, info), function (key, v) {
					var isIndexed = _immutable.Iterable.isIndexed(v);
					return isIndexed ? v.toList() : v.toOrderedMap();
				});

				var notInitFragms = [];
				(0, _forEachDeep2.default)(newData, function (f, k) {
					if (!f.initialize) {
						notInitFragms.push([f, k]);
					}
				});
				notInitCb(notInitFragms);
			} else {
				newData = this._mergeData(myValue, path, options, info, notInitCb);
			}

			this.data = newData;

			this.normalizeData = null;
			this.dataForPaths = new Map();

			this.afterSet(myValue, prevData, this.normalizeData, undefined, options, info);

			return this;
		}

		/* eslint-disable no-unused-vars */

	}, {
		key: 'afterSet',
		value: function afterSet(value, prevData, newData, setData, options, info) {
			return;
		}
		/* eslint-enable no-unused-vars */

	}, {
		key: 'init',
		value: function init() {
			return {};
		}
	}]);
	return Fragment;
}(), (_applyDecoratedDescriptor(_class.prototype, 'getDataIn', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'getDataIn'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'getData', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'getData'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, '_mergeData', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, '_mergeData'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'dispatchFragment', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'dispatchFragment'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, '_setData', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, '_setData'), _class.prototype)), _class);
exports.default = Fragment;