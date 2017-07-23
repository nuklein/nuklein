'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _desc, _value, _class;

var _immutable = require('immutable');

var _kefir = require('kefir');

var _kefir2 = _interopRequireDefault(_kefir);

var _autobindDecorator = require('autobind-decorator');

var _autobindDecorator2 = _interopRequireDefault(_autobindDecorator);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fragment = require('./fragment');

var _fragment2 = _interopRequireDefault(_fragment);

var _normolizeSetPath = require('./utils/normolizeSetPath');

var _normolizeSetPath2 = _interopRequireDefault(_normolizeSetPath);

var _getPathParse = require('./utils/getPathParse');

var _getPathParse2 = _interopRequireDefault(_getPathParse);

var _mergeDeepWith = require('./utils/mergeDeepWith');

var _mergeDeepWith2 = _interopRequireDefault(_mergeDeepWith);

var _initialize = require('./utils/initialize');

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

var isNode = false;
if ((typeof process === 'undefined' ? 'undefined' : (0, _typeof3.default)(process)) === 'object') {
	if ((0, _typeof3.default)(process.versions) === 'object') {
		if (typeof process.versions.node !== 'undefined') {
			isNode = true;
		}
	}
}

var Store = (_class = function () {
	function Store(props) {
		var _this2 = this;

		(0, _classCallCheck3.default)(this, Store);

		var localProps = this.beforeInit(props || {}) || {};
		this.props = localProps;

		var initialData = this.init(localProps);
		this.data = (0, _immutable.fromJS)(initialData, function (key, value) {
			var isIndexed = _immutable.Iterable.isIndexed(value);
			return isIndexed ? value.toList() : value.toOrderedMap();
		});

		this.normalizeData = this.getDataIn()();
		this.emptyPath = false;
		this.dataForPaths = new Map();

		this.getCount = 0;
		this.specificGetCount = 0;

		if (isNode) {
			var MyEmitter = function (_EventEmitter) {
				(0, _inherits3.default)(MyEmitter, _EventEmitter);

				function MyEmitter() {
					(0, _classCallCheck3.default)(this, MyEmitter);
					return (0, _possibleConstructorReturn3.default)(this, (MyEmitter.__proto__ || Object.getPrototypeOf(MyEmitter)).apply(this, arguments));
				}

				return MyEmitter;
			}(_events2.default);

			this.emitter = new MyEmitter();
			this.stream = _kefir2.default.fromEvents(this.emitter, 'event').onValue(function (params) {
				return _this2.setData.apply(_this2, (0, _toConsumableArray3.default)(params)).getStore();
			});
			(0, _initialize.initializeFor)(this.data, this.setStore, this.getStore);
			this.afterInit(localProps, this.setStore, this.getStore);
		} else {
			this.stream = _kefir2.default.stream(function (emitter) {
				_this2.emitter = emitter;
				(0, _initialize.initializeFor)(_this2.data, _this2.setStore, _this2.getStore);
				_this2.afterInit(localProps, _this2.setStore, _this2.getStore);
			}).map(function (params) {
				return _this2.setData.apply(_this2, (0, _toConsumableArray3.default)(params)).getStore();
			});
		}
	}
	/* eslint-enable react/sort-comp */

	/* eslint-disable no-unused-vars */

	/* eslint-disable react/sort-comp */


	(0, _createClass3.default)(Store, [{
		key: 'beforeInit',
		value: function beforeInit(props) {
			return props;
		}
		/* eslint-enable no-unused-vars */

		/* eslint-disable no-unused-vars */

	}, {
		key: 'afterInit',
		value: function afterInit(props, setStore) {
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
	}, {
		key: 'getDataIn',
		value: function getDataIn(store) {
			var _this3 = this;

			return function (path) {
				var localData = _this3.data;
				if (store) {
					if (store instanceof Store || store instanceof _fragment2.default) {
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
					value = (0, _getPathParse2.default)(path, value).value;

					if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) !== 'object') {
						// @TODO собирание не найденных значений, а потом вызов onDataNotFoundAll()
						return value;
					}
					if (_immutable.Iterable.isIterable(value)) {
						value = value.toJS();
					}
					return value;
				}

				if (value instanceof _fragment2.default) {
					/*
     надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
     чтобы это точно работало правильно.
     */
					var result = void 0;
					if (value._getData && typeof value._getData === 'function') {
						result = value._getData(undefined, value.getDataIn());
						value.getCounter();
					} else {
						value.beforeGet();
						result = value.getData(undefined, value.getDataIn());
						value.getCounter();
						value.afterGet(result);
					}
					return result;
				}

				if (value && value.mergeDeepWith && typeof value.mergeDeepWith === 'function') {
					value = value.mergeDeepWith(function (v) {
						if (v && v instanceof _fragment2.default) {
							/*
       надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
       чтобы это точно работало правильно.
       */
							var _result = void 0;
							if (v._getData && typeof v._getData === 'function') {
								_result = v._getData(undefined, v.getDataIn());
								v.getCounter();
							} else {
								v.beforeGet();
								_result = v.getData(undefined, v.getDataIn());
								v.getCounter();
								v.afterGet(_result);
							}
							return _result;
						}
						return v;
					}, value);

					value = value.toJS();
				}

				return value;
			};
		}
	}, {
		key: 'getData',
		value: function getData(path) {
			return this.getDataIn()(path);
		}
	}, {
		key: 'beforeGet',
		value: function beforeGet(path) {
			return path;
		}
	}, {
		key: 'getStore',
		value: function getStore(path) {
			if (!path) {
				if (this.emptyPath === false) {
					this.emptyPath = this.beforeGet();
				}
				var _result2 = this.normalizeData;
				this.getCounter(false);
				this.afterGet(_result2, this.emptyPath, false);
				return _result2;
			}
			var newPath = this.beforeGet(path);
			var result = void 0;
			var specific = false;
			if (!newPath) {
				result = this.normalizeData;
			} else {
				specific = true;
				if (this.dataForPaths.has(newPath)) {
					result = this.dataForPaths.get(newPath);
				} else {
					result = this.getData(newPath);
					this.dataForPaths.set(newPath, result);
				}
			}
			this.getCounter(specific);
			this.afterGet(result, newPath, specific);
			return result;
		}

		/* eslint-disable no-unused-vars */

	}, {
		key: 'afterGet',
		value: function afterGet(result, path, specific) {
			return;
		}
		/* eslint-enable no-unused-vars */

		/* eslint-disable no-unused-vars */

	}, {
		key: 'beforeSet',
		value: function beforeSet(value, path, data, options, info) {
			return { value: value, path: path };
		}
		/* eslint-enable no-unused-vars */

	}, {
		key: '_mergeValue',
		value: function _mergeValue(data, value, path, options, info, notInitFragms) {
			var _this4 = this;

			var nif = notInitFragms;
			var localData = void 0;
			if (options && (options === 'replace' || options.method === 'replace')) {
				localData = value;
			} else {
				localData = (0, _mergeDeepWith2.default)(data, function (prev, next, key, localPath) {
					var niPath = localPath.concat(key);
					if (_this4.path) {
						niPath = _this4.path.concat(niPath);
					}
					var myPath = void 0;
					if (path) {
						myPath = path.slice(localPath.concat(key).length);
					}
					if (prev && prev instanceof _fragment2.default) {
						var localNext = next;

						if (next instanceof _fragment2.default) {
							localNext = next.data;
						}

						var result = void 0;
						if (!localNext) {
							result = prev;
						} else {
							result = prev._setData(localNext.toJS(), myPath, options, info, function (fr) {
								nif = nif.concat(fr);
							});
						}

						return (0, _immutable.fromJS)(result, function (_key, val) {
							var isIndexed = _immutable.Iterable.isIndexed(val);
							return isIndexed ? val.toList() : val.toOrderedMap();
						});
					}

					/*
     надо попробовать переписать так, чтобы сразу выполнялась инциализация,
     */
					if (next instanceof _fragment2.default && !next.initialize) {
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
		key: 'mergeData',
		value: function mergeData(value, path, options, info) {
			var _this5 = this;

			var normPath = [];
			if (path) {
				normPath = (0, _normolizeSetPath2.default)(path, true);
			}

			var notInitFragms = [];
			var localData = void 0;

			if (this.data instanceof _fragment2.default) {
				localData = this.data._setData(value, path, options, info, function (fr) {
					notInitFragms = notInitFragms.concat(fr);
				});
			} else if (path) {
				var ld = this.data;
				var immMap = [];
				var keys = [];
				var index = 0;
				normPath.forEach(function (key, i) {
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
						var result = this._mergeValue(immMap[0][0], value, index > 0 ? normPath.slice(index - 1) : normPath.slice(1), options, info, notInitFragms);
						localData = this.data.setIn(keys.slice(-1), result.data);
						notInitFragms = notInitFragms.concat(result.notInitFragms);
					} else if (immMap[0][0] instanceof _fragment2.default) {
						var newPath = index > 0 ? normPath.slice(index - 1) : normPath.slice(1);
						var _result3 = immMap[0][0]._setData(value, newPath, options, info, function (fr) {
							notInitFragms = notInitFragms.concat(fr);
						});
						notInitFragms.push([immMap[0][0], newPath]);
						if (keys.length > 1) {
							localData = this.data.setIn(keys, _result3);
						} else {
							localData = this.data.set(keys[0], _result3);
						}
					} else {
						if (value instanceof _fragment2.default) {
							notInitFragms.push([value, keys]);
						}
						if (keys.length > 1) {
							localData = this.data.setIn(keys, value);
						} else {
							localData = this.data.set(keys[0], value);
						}
					}
				} else if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
					var _result4 = this._mergeValue(this.data, value, normPath, options, info, notInitFragms);
					localData = _result4.data;
					notInitFragms = notInitFragms.concat(_result4.notInitFragms);
				} else {
					if (value instanceof _fragment2.default) {
						notInitFragms.push([value, []]);
					}
					localData = value;
				}
			} else if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
				var _result5 = this._mergeValue(this.data, value, normPath, options, info, notInitFragms);
				localData = _result5.data;
				notInitFragms = notInitFragms.concat(_result5.notInitFragms);
			} else {
				localData = value;
			}

			if (notInitFragms.length > 0) {
				notInitFragms.forEach(function (v) {
					(0, _initialize.initialize)(v[0], v[1], _this5.setStore, _this5.getStore);
				});
			}

			if (localData instanceof _fragment2.default || _immutable.List.isList(localData) || _immutable.OrderedMap.isOrderedMap(localData)) {
				return localData;
			}

			if (_immutable.Iterable.isIndexed(localData)) {
				return localData.toList();
			}
			return localData.toOrderedMap();
		}
	}, {
		key: 'setData',
		value: function setData(value, path, options, info) {
			var _this6 = this;

			var _beforeSet = this.beforeSet(value, path, this.getStore(), options, info),
			    _beforeSet$value = _beforeSet.value,
			    myValue = _beforeSet$value === undefined ? value : _beforeSet$value,
			    _beforeSet$path = _beforeSet.path,
			    myPath = _beforeSet$path === undefined ? path : _beforeSet$path;

			var prevData = this.getStore();

			// надо будет добавить пользовательские setData
			this.data = this.mergeData(myValue, myPath, options, info);

			this.normalizeData = this.getDataIn()();
			this.dataForPaths = new Map();

			setTimeout(function () {
				_this6.afterSet(myValue, myPath, prevData, _this6.normalizeData, options, info);
			}, 0);

			return this;
		}
	}, {
		key: 'setStore',
		value: function setStore(value, path, options, info) {
			if (isNode) {
				this.emitter.emit('event', [value, path, options, info]);
			} else {
				this.emitter.emit([value, path, options, info]);
			}
		}

		/* eslint-disable no-unused-vars */

	}, {
		key: 'afterSet',
		value: function afterSet(value, path, prevData, data, options, info) {
			return;
		}
		/* eslint-enable no-unused-vars */

	}, {
		key: 'init',
		value: function init() {
			return {};
		}
	}]);
	return Store;
}(), (_applyDecoratedDescriptor(_class.prototype, 'getDataIn', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'getDataIn'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'getData', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'getData'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'getStore', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'getStore'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'mergeData', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'mergeData'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setData', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'setData'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setStore', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'setStore'), _class.prototype)), _class);
exports.default = Store;