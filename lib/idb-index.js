'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _idbRange = require('idb-range');

var _idbRange2 = _interopRequireDefault(_idbRange);

var _idbRequest = require('idb-request');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Index = function () {

  /**
   * Initialize new `Index`.
   *
   * @param {Store} store
   * @param {Object} opts { name, field, unique, multi }
   */

  function Index(store, opts) {
    _classCallCheck(this, Index);

    this.store = store;
    this.name = opts.name;
    this.field = opts.field;
    this.multi = opts.multiEntry;
    this.unique = opts.unique;
  }

  /**
   * Get value by `key`.
   *
   * @param {Any} key
   * @return {Promise}
   */

  _createClass(Index, [{
    key: 'get',
    value: function get(key) {
      var _this = this;

      return this.store.db.getInstance().then(function (db) {
        var index = db.transaction(_this.store.name, 'readonly').objectStore(_this.store.name).index(_this.name);
        return (0, _idbRequest.request)(index.get(key));
      });
    }

    /**
     * Get all values matching `range`.
     *
     * @param {Any} [range]
     * @return {Promise}
     */

  }, {
    key: 'getAll',
    value: function getAll(range) {
      var result = [];
      return this.cursor({ range: range, iterator: iterator }).then(function () {
        return result;
      });

      function iterator(cursor) {
        result.push(cursor.value);
        cursor.continue();
      }
    }

    /**
     * Count records in `range`.
     *
     * @param {Any} range
     * @return {Promise}
     */

  }, {
    key: 'count',
    value: function count(range) {
      var _this2 = this;

      return this.store.db.getInstance().then(function (db) {
        try {
          var index = db.transaction(_this2.store.name, 'readonly').objectStore(_this2.store.name).index(_this2.name);
          return (0, _idbRequest.request)(range ? index.count((0, _idbRange2.default)(range)) : index.count());
        } catch (_) {
          // fix https://github.com/axemclion/IndexedDBShim/issues/202
          return _this2.getAll(range).then(function (all) {
            return all.length;
          });
        }
      });
    }

    /**
     * Create read cursor for specific `range`,
     * and pass IDBCursor to `iterator` function.
     *
     * @param {Object} opts { [range], [direction], iterator }
     * @return {Promise}
     */

  }, {
    key: 'cursor',
    value: function cursor(_ref) {
      var _this3 = this;

      var iterator = _ref.iterator;
      var range = _ref.range;
      var direction = _ref.direction;

      if (typeof iterator !== 'function') throw new TypeError('iterator is required');
      return this.store.db.getInstance().then(function (db) {
        // fix: https://github.com/axemclion/IndexedDBShim/issues/204
        if (direction === 'prevunique' && !_this3.multi) {
          (function () {
            var method = iterator;
            var keys = {}; // count unique keys
            direction = 'prev';
            iterator = function iterator(cursor) {
              if (!keys[cursor.key]) {
                keys[cursor.key] = true;
                method(cursor);
              } else {
                cursor.continue();
              }
            };
          })();
        }

        var index = db.transaction(_this3.store.name, 'readonly').objectStore(_this3.store.name).index(_this3.name);
        var req = index.openCursor((0, _idbRange2.default)(range), direction || 'next');
        return (0, _idbRequest.requestCursor)(req, iterator);
      });
    }
  }]);

  return Index;
}();

exports.default = Index;
module.exports = exports['default'];