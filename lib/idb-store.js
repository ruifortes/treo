'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _idbRange = require('idb-range');

var _idbRange2 = _interopRequireDefault(_idbRange);

var _idbRequest = require('idb-request');

var _idbIndex = require('./idb-index');

var _idbIndex2 = _interopRequireDefault(_idbIndex);

var _idbBatch = require('./idb-batch');

var _idbBatch2 = _interopRequireDefault(_idbBatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Store = function () {

  /**
   * Initialize new `Store`.
   *
   * @param {Database} db
   * @param {Object} opts { name, keyPath, autoIncrement, indexes }
   */

  function Store(db, opts) {
    var _this = this;

    _classCallCheck(this, Store);

    this.db = db;
    this.opts = opts.indexes;
    this.name = opts.name;
    this.key = opts.keyPath;
    this.increment = opts.autoIncrement;
    this.indexes = opts.indexes.map(function (index) {
      return index.name;
    });

    this.indexes.forEach(function (indexName) {
      if (typeof _this[indexName] !== 'undefined') return;
      Object.defineProperty(_this, indexName, {
        get: function get() {
          return this.index(indexName);
        }
      });
    });
  }

  /**
   * Get index by `name`.
   *
   * @param {String} name
   * @return {Index}
   */

  _createClass(Store, [{
    key: 'index',
    value: function index(name) {
      var i = this.indexes.indexOf(name);
      if (i === -1) throw new TypeError('invalid index name');
      return new _idbIndex2.default(this, this.opts[i]);
    }

    /**
     * Add `value` to `key`.
     *
     * @param {Any} [key] is optional when store.key exists.
     * @param {Any} val
     * @return {Promise}
     */

  }, {
    key: 'add',
    value: function add(key, val) {
      var _this2 = this;

      return this.db.getInstance().then(function (db) {
        return (0, _idbBatch2.default)(db, _this2.name, [{ key: key, val: val, type: 'add' }]).then(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 1);

          var res = _ref2[0];
          return res;
        });
      });
    }

    /**
     * Put (create or replace) `val` to `key`.
     *
     * @param {Any} [key] is optional when store.key exists.
     * @param {Any} val
     * @return {Promise}
     */

  }, {
    key: 'put',
    value: function put(key, val) {
      var _this3 = this;

      return this.db.getInstance().then(function (db) {
        return (0, _idbBatch2.default)(db, _this3.name, [{ key: key, val: val, type: 'put' }]).then(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 1);

          var res = _ref4[0];
          return res;
        });
      });
    }

    /**
     * Del value by `key`.
     *
     * @param {String} key
     * @return {Promise}
     */

  }, {
    key: 'del',
    value: function del(key) {
      var _this4 = this;

      return this.db.getInstance().then(function (db) {
        return (0, _idbBatch2.default)(db, _this4.name, [{ key: key, type: 'del' }]).then(function (_ref5) {
          var _ref6 = _slicedToArray(_ref5, 1);

          var res = _ref6[0];
          return res;
        });
      });
    }

    /**
     * Proxy to idb-batch.
     *
     * @param {Object|Array} ops
     * @return {Promise}
     */

  }, {
    key: 'batch',
    value: function batch(ops) {
      var _this5 = this;

      return this.db.getInstance().then(function (db) {
        return (0, _idbBatch2.default)(db, _this5.name, ops);
      });
    }

    /**
     * Clear.
     *
     * @return {Promise}
     */

  }, {
    key: 'clear',
    value: function clear() {
      var _this6 = this;

      return this.db.getInstance().then(function (db) {
        var tr = db.transaction(_this6.name, 'readwrite');
        return (0, _idbRequest.request)(tr.objectStore(_this6.name).clear(), tr);
      });
    }

    /**
     * Get one value by `key`.
     *
     * @param {Any} key
     * @return {Promise}
     */

  }, {
    key: 'get',
    value: function get(key) {
      var _this7 = this;

      return this.db.getInstance().then(function (db) {
        return (0, _idbRequest.request)(db.transaction(_this7.name, 'readonly').objectStore(_this7.name).get(key));
      });
    }

    /**
     * Count.
     *
     * @param {Any} [range]
     * @return {Promise}
     */

  }, {
    key: 'count',
    value: function count(range) {
      var _this8 = this;

      return this.db.getInstance().then(function (db) {
        try {
          var store = db.transaction(_this8.name, 'readonly').objectStore(_this8.name);
          return (0, _idbRequest.request)(range ? store.count((0, _idbRange2.default)(range)) : store.count());
        } catch (_) {
          // fix https://github.com/axemclion/IndexedDBShim/issues/202
          return _this8.getAll(range).then(function (all) {
            return all.length;
          });
        }
      });
    }

    /**
     * Get all.
     *
     * @param {Any} [range]
     * @return {Promise}
     */

  }, {
    key: 'getAll',
    value: function getAll(range) {
      var result = [];
      return this.cursor({ iterator: iterator, range: range }).then(function () {
        return result;
      });

      function iterator(cursor) {
        result.push(cursor.value);
        cursor.continue();
      }
    }

    /**
     * Create read cursor for specific `range`,
     * and pass IDBCursor to `iterator` function.
     *
     * @param {Object} opts:
     *   {Any} [range] - passes to .openCursor()
     *   {String} [direction] - "prev", "prevunique", "next", "nextunique"
     *   {Function} iterator - function to call with IDBCursor
     * @return {Promise}
     */

  }, {
    key: 'cursor',
    value: function cursor(_ref7) {
      var _this9 = this;

      var iterator = _ref7.iterator;
      var range = _ref7.range;
      var direction = _ref7.direction;

      if (typeof iterator !== 'function') throw new TypeError('iterator is required');
      return this.db.getInstance().then(function (db) {
        var store = db.transaction(_this9.name, 'readonly').objectStore(_this9.name);
        var req = store.openCursor((0, _idbRange2.default)(range), direction || 'next');
        return (0, _idbRequest.requestCursor)(req, iterator);
      });
    }
  }]);

  return Store;
}();

exports.default = Store;
module.exports = exports['default'];