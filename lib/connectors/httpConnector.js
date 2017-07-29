'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _kefir = require('kefir');

var _kefir2 = _interopRequireDefault(_kefir);

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _index = require('../index');

var _mergeDataToPath = require('../utils/mergeDataToPath');

var _mergeDataToPath2 = _interopRequireDefault(_mergeDataToPath);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (addr) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	return function (MyFragment) {
		var _class, _temp, _initialiseProps;

		var beforeGetData = options.beforeGetData,
		    afterGetData = options.afterGetData,
		    onlyLocalModificators = options.onlyLocalModificators,
		    onGetError = options.onGetError,
		    getErrorData = options.getErrorData,
		    onSetError = options.onSetError,
		    setErrorData = options.setErrorData,
		    onSet = options.onSet,
		    debounceForSet = options.debounceForSet,
		    onlyServerModificators = options.onlyServerModificators;


		return _temp = _class = function (_Fragment) {
			(0, _inherits3.default)(HttpConnector, _Fragment);

			function HttpConnector() {
				var _ref;

				(0, _classCallCheck3.default)(this, HttpConnector);

				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				var _this = (0, _possibleConstructorReturn3.default)(this, (_ref = HttpConnector.__proto__ || Object.getPrototypeOf(HttpConnector)).call.apply(_ref, [this].concat(args)));

				_initialiseProps.call(_this);

				_this.stream = _kefir2.default.stream(function (emitter) {
					_this.setStreamEmitter = emitter;
				}).onValue(_this.kefirOnValue);

				if (debounceForSet) {
					if (typeof debounceForSet === 'number') {
						_this.debounceStreams = _kefir2.default.stream(function (emitter) {
							_this.debounceEmitters = emitter;
						}).debounce(debounceForSet).onValue(_this.kefirOnValue);
					} else if ((typeof debounceForSet === 'undefined' ? 'undefined' : (0, _typeof3.default)(debounceForSet)) === 'object') {
						_this.debounceStreams = {};
						_this.debounceEmitters = {};

						Object.keys(debounceForSet).forEach(function (key) {
							_this.debounceStreams[key] = _kefir2.default.stream(function (emitter) {
								_this.debounceEmitters[key] = emitter;
							}).debounce(debounceForSet[key]).onValue(_this.kefirOnValue);
						});
					}
				}
				return _this;
			}

			(0, _createClass3.default)(HttpConnector, [{
				key: 'init',
				value: function init() {
					return new MyFragment();
				}
			}, {
				key: 'getDataFromServer',
				value: function getDataFromServer(path) {
					var _this2 = this;

					if (beforeGetData !== undefined && beforeGetData !== null) {
						this.data.setData(beforeGetData, null, null, { method: this.onDataNotFoundAll });
					}

					(0, _isomorphicFetch2.default)(addr, {
						method: 'POST',
						body: JSON.stringify({
							method: 'getStore',
							args: [path]
						}),
						headers: {
							'Content-Type': 'application/json'
						}
					}).then(function (res) {
						return res.json();
					}).then(function (res) {
						var data = (0, _mergeDataToPath2.default)(res, path);

						if (afterGetData) {
							data = (0, _extends3.default)({}, data, afterGetData);
						}

						_this2.data.setData(data, null, { clearPaths: true }, { method: _this2.onDataNotFoundAll });
					}).catch(function (err) {
						if (!getErrorData && typeof onGetError !== 'function') {
							console.error(err);
						}

						if (getErrorData) {
							_this2.data.setData(getErrorData, null, null, { method: _this2.onDataNotFoundAll });
						}

						if (typeof onGetError === 'function') {
							onGetError.bind(_this2.data)(err);
						}
					});
				}
			}, {
				key: 'afterInit',
				value: function afterInit() {
					this.data.getDataFromServer = this.getDataFromServer.bind(this);
				}
			}, {
				key: 'setData',
				value: function setData(value, path, setDataOptions, info) {
					var clearPaths = void 0;
					if (setDataOptions) {
						clearPaths = setDataOptions.clearPaths;
					}

					if (clearPaths) {
						this.dataNotFoundPaths = [];
						this.data.dataNotFoundPaths = [];
					}

					var fragmentName = this.constructor.name;
					var innerFragmentName = this.data.constructor.name;

					var callingFragment = void 0;
					var callingModificator = void 0;
					if (info) {
						callingFragment = info.fragment;
						callingModificator = info.modificator;
					}

					var callingFragmentName = void 0;
					if (callingFragment instanceof _index.Fragment) {
						callingFragmentName = callingFragment.constructor.name;
					}

					var isCallOfThis = callingFragmentName === fragmentName || callingFragmentName === innerFragmentName;

					var callingModificatorName = void 0;
					if (callingModificator) {
						callingModificatorName = callingModificator.name;
					}

					var isIgnore = false;
					if (onlyLocalModificators && callingModificatorName) {
						isIgnore = onlyLocalModificators.find(function (v) {
							return v === callingModificatorName;
						});
					}

					if (isCallOfThis || isIgnore) {
						return this.original.setData(value, path, setDataOptions, info);
					}

					if (debounceForSet) {
						if (this.debounceEmitters) {
							if (typeof debounceForSet === 'number') {
								this.debounceEmitters.emit({ value: value, path: path, setDataOptions: setDataOptions, info: info });
							} else if ((typeof debounceForSet === 'undefined' ? 'undefined' : (0, _typeof3.default)(debounceForSet)) === 'object') {
								if (callingModificatorName && debounceForSet[callingModificatorName]) {
									this.debounceEmitters[callingModificatorName].emit({
										value: value,
										path: path,
										setDataOptions: setDataOptions,
										info: info
									});
								} else if (this.setStreamEmitter) {
									this.setStreamEmitter.emit({ value: value, path: path, setDataOptions: setDataOptions, info: info });
								}
							}
						}
					} else if (this.setStreamEmitter) {
						this.setStreamEmitter.emit({ value: value, path: path, setDataOptions: setDataOptions, info: info });
					}

					var isOnlyServer = false;
					if (callingModificatorName && onlyServerModificators) {
						isOnlyServer = onlyServerModificators.find(function (v) {
							return v === callingModificatorName;
						});
					}

					if (isOnlyServer) {
						return this.data;
					}

					return this.original.setData(value, path, setDataOptions, info);
				}
			}, {
				key: 'onDataNotFoundAll',
				value: function onDataNotFoundAll(path) {
					this.getDataFromServer(path);
				}
			}]);
			return HttpConnector;
		}(_index.Fragment), _initialiseProps = function _initialiseProps() {
			var _this3 = this;

			this.kefirOnValue = function (args) {
				var value = args.value,
				    path = args.path,
				    setDataOptions = args.setDataOptions,
				    _args$info = args.info,
				    info = _args$info === undefined ? {} : _args$info;


				var localInfo = {};
				var notEmpty = false;
				if (info.server) {
					notEmpty = true;
					localInfo.server = info.server;
				}
				if (info.component) {
					notEmpty = true;
					localInfo.component = info.component.name;
				}
				if (info.modificator) {
					notEmpty = true;
					localInfo.modificator = info.modificator.name;
				}
				if (info.fragment) {
					notEmpty = true;
					localInfo.fragment = info.fragment.constructor.name;
				}
				if (info.method) {
					notEmpty = true;
					localInfo.method = info.method.name;
				}

				(0, _isomorphicFetch2.default)(addr, {
					method: 'POST',
					body: JSON.stringify({
						method: 'setStore',
						args: [value, path, setDataOptions, notEmpty ? localInfo : null]
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				}).then(function (res) {
					return res.json();
				}).then(function (res) {
					if (typeof onSet === 'function') {
						onSet.bind(_this3.data)({ value: value, path: path, options: setDataOptions, info: info, resultat: res });
					}
				}).catch(function (err) {
					if (!setErrorData && typeof onSetError !== 'function') {
						console.error(err);
					}

					if (setErrorData) {
						_this3.data.setData(setErrorData, null, null, { method: _this3.setData });
					}

					if (typeof onSetError === 'function') {
						onSetError.bind(_this3.data)(err);
					}
				});
			};
		}, _temp;
	};
}; // eslint-disable-line