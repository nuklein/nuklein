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

var _buildPathForStore = require('../utils/buildPathForStore');

var _buildPathForStore2 = _interopRequireDefault(_buildPathForStore);

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
		    debounceForGet = options.debounceForGet,
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

				_this.debounceForSetStream = _kefir2.default.stream(function (emitter) {
					_this.debounceForSetEmitter = emitter;
				}).onValue(_this.kefirOnValueForSet);

				if (debounceForSet) {
					if (typeof debounceForSet === 'number') {
						_this.debounceForSetStreams = _kefir2.default.stream(function (emitter) {
							_this.debounceForSetEmitters = emitter;
						}).debounce(debounceForSet).onValue(_this.kefirOnValueForSet);
					} else if ((typeof debounceForSet === 'undefined' ? 'undefined' : (0, _typeof3.default)(debounceForSet)) === 'object') {
						_this.debounceForSetStreams = {};
						_this.debounceForSetEmitters = {};

						Object.keys(debounceForSet).forEach(function (key) {
							_this.debounceForSetStreams[key] = _kefir2.default.stream(function (emitter) {
								_this.debounceForSetEmitters[key] = emitter;
							}).debounce(debounceForSet[key]).onValue(_this.kefirOnValueForSet);
						});
					}
				}

				if (debounceForGet) {
					if (typeof debounceForGet === 'number') {
						_this.debounceForGetStreams = _kefir2.default.stream(function (emitter) {
							_this.debounceForGetEmitters = emitter;
						}).scan(function (acc, next) {
							var newAcc = (0, _extends3.default)({}, acc, {
								path: (0, _buildPathForStore2.default)(next.path, acc.path)
							});
							return newAcc;
						}).debounce(debounceForGet).onValue(_this.getDataFromServer);
					} else if ((typeof debounceForGet === 'undefined' ? 'undefined' : (0, _typeof3.default)(debounceForGet)) === 'object') {
						_this.debounceForGetStreams = {};
						_this.debounceForGetEmitters = {};

						Object.keys(debounceForGet).forEach(function (key) {
							var cachePath = null;

							_this.debounceForGetStreams[key] = _kefir2.default.stream(function (emitter) {
								_this.debounceForGetEmitters[key] = emitter;
							}).scan(function (acc, next) {
								if (!cachePath) {
									cachePath = (0, _buildPathForStore2.default)(next.path);
								} else {
									cachePath = (0, _buildPathForStore2.default)(next.path, acc.path);
								}
								var newAcc = (0, _extends3.default)({}, acc, {
									path: cachePath
								});
								return newAcc;
							}).debounce(debounceForGet[key]).onValue(function () {
								cachePath = null;
								_this.getDataFromServer.apply(_this, arguments);
							});
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
				value: function getDataFromServer(args) {
					var _this2 = this;

					var path = args.path,
					    isStream = args.isStream;


					if (this.dataNotFoundPaths.length || this.data.dataNotFoundPaths.length) {
						if (beforeGetData !== undefined && beforeGetData !== null) {
							this.data.setData(beforeGetData, null, null, { method: this.onDataNotFound });
						}

						var pathForServer = path;
						if (!isStream) {
							pathForServer = (0, _buildPathForStore2.default)(path);
						}

						(0, _isomorphicFetch2.default)(addr, {
							method: 'POST',
							body: JSON.stringify({
								method: 'getStore',
								args: [pathForServer]
							}),
							headers: {
								'Content-Type': 'application/json'
							}
						}).then(function (res) {
							return res.json();
						}).then(function (res) {
							var data = res;

							if (afterGetData) {
								data = (0, _extends3.default)({}, data, afterGetData);
							}

							_this2.data.setData(data, null, null, { method: _this2.onDataNotFound }).then(function () {
								_this2.data.setData(null, null, { clearPaths: true }, { method: _this2.onDataNotFound });
							});
						}).catch(function (err) {
							if (!getErrorData && typeof onGetError !== 'function') {
								console.error(err);
							}

							if (getErrorData) {
								_this2.data.setData(getErrorData, null, null, { method: _this2.onDataNotFound });
							}

							if (typeof onGetError === 'function') {
								onGetError.bind(_this2.data)(err);
							}
						});
					}
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
						if (this.debounceForSetEmitters) {
							if (typeof debounceForSet === 'number') {
								this.debounceForSetEmitters.emit({ value: value, path: path, setDataOptions: setDataOptions, info: info });
							} else if ((typeof debounceForSet === 'undefined' ? 'undefined' : (0, _typeof3.default)(debounceForSet)) === 'object') {
								if (callingModificatorName && debounceForSet[callingModificatorName]) {
									this.debounceForSetEmitters[callingModificatorName].emit({
										value: value,
										path: path,
										setDataOptions: setDataOptions,
										info: info
									});
								} else if (this.debounceForSetEmitter) {
									this.debounceForSetEmitter.emit({ value: value, path: path, setDataOptions: setDataOptions, info: info });
								}
							}
						}
					} else if (this.debounceForSetEmitter) {
						this.debounceForSetEmitter.emit({ value: value, path: path, setDataOptions: setDataOptions, info: info });
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
				key: 'onDataNotFound',
				value: function onDataNotFound(path, info) {
					if (debounceForGet) {
						if (this.debounceForGetEmitters) {
							if (typeof debounceForGet === 'number') {
								this.debounceForGetEmitters.emit({ path: path, isStream: true });
							} else if ((typeof debounceForGet === 'undefined' ? 'undefined' : (0, _typeof3.default)(debounceForGet)) === 'object') {
								var callingComponentName = void 0;
								if (info && info.component) {
									callingComponentName = info.component.name;
								}

								if (callingComponentName && debounceForGet[callingComponentName]) {
									this.debounceForGetEmitters[callingComponentName].emit({ path: path, isStream: true });
								} else {
									this.getDataFromServer({ path: path });
								}
							}
						}
					} else {
						this.getDataFromServer({ path: path });
					}
				}
			}]);
			return HttpConnector;
		}(_index.Fragment), _initialiseProps = function _initialiseProps() {
			var _this3 = this;

			this.kefirOnValueForSet = function (args) {
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