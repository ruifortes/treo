'use strict';

var _idbSchema = require('idb-schema');

var _idbSchema2 = _interopRequireDefault(_idbSchema);

var _idbDatabase = require('./idb-database');

var _idbDatabase2 = _interopRequireDefault(_idbDatabase);

var _idbStore = require('./idb-store');

var _idbStore2 = _interopRequireDefault(_idbStore);

var _idbIndex = require('./idb-index');

var _idbIndex2 = _interopRequireDefault(_idbIndex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Expose API.
 */

exports = module.exports = function (name, schema) {
  return new _idbDatabase2.default(name, schema);
};
exports.schema = function () {
  return new _idbSchema2.default();
};

/**
 * Expose core classes.
 */

exports.Schema = _idbSchema2.default;
exports.Database = _idbDatabase2.default;
exports.Store = _idbStore2.default;
exports.Index = _idbIndex2.default;