'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _immutable = require('immutable');

var _index = require('../index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (propName, options) {
	return function (MyFragment) {
		return function (_Fragment) {
			(0, _inherits3.default)(ArrayDecorator, _Fragment);

			function ArrayDecorator() {
				(0, _classCallCheck3.default)(this, ArrayDecorator);
				return (0, _possibleConstructorReturn3.default)(this, (ArrayDecorator.__proto__ || Object.getPrototypeOf(ArrayDecorator)).apply(this, arguments));
			}

			(0, _createClass3.default)(ArrayDecorator, [{
				key: 'init',
				value: function init() {
					return new MyFragment();
				}
			}, {
				key: 'unshift',
				value: function unshift(value) {
					if (propName) {
						var prevData = this.data.data.get(propName).toJS();
						prevData.unshift(value);
						var newData = (0, _immutable.fromJS)(prevData);
						this.data.data = this.data.data.set(propName, newData);
					}
					return this.data;
				}
			}, {
				key: 'push',
				value: function push(value) {
					if (propName) {
						var prevData = this.data.data.get(propName).toJS();
						prevData.push(value);
						var newData = (0, _immutable.fromJS)(prevData);
						this.data.data = this.data.data.set(propName, newData);
					}
					return this.data;
				}
			}, {
				key: 'setData',
				value: function setData(value, path, setOptions, info) {
					if (setOptions && setOptions.method && value && typeof this[setOptions.method] === 'function') {
						if (options && options.include && !options.include.includes(setOptions.method)) {
							return this.original.setData(value, path, setOptions, info);
						}
						return this[setOptions.method](value);
					}
					return this.original.setData(value, path, setOptions, info);
				}
			}]);
			return ArrayDecorator;
		}(_index.Fragment);
	};
};