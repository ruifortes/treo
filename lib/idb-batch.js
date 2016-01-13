'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = batch;

var _isPlainObj = require('is-plain-obj');

var _isPlainObj2 = _interopRequireDefault(_isPlainObj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isSafari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent);
var slice = [].slice;
var map = [].map;

/**
 * Perform batch operation using `ops`.
 * It uses raw callback API to avoid issues with transaction reuse.
 *
 * {
 * 	 key1: 'val1', // put val1 to key1
 * 	 key2: 'val2', // put val2 to key2
 * 	 key3: null,   // delete key
 * }
 *
 * @param {Object|Array} ops
 * @return {Promise}
 */

function batch(db, storeName, ops) {
  if ((0, _isPlainObj2.default)(ops)) {
    ops = Object.keys(ops).map(function (key) {
      return { key: key, value: ops[key], type: ops[key] === null ? 'del' : 'put' };
    });
  }

  ops.forEach(function (op) {
    if (['add', 'put', 'del'].indexOf(op.type) === -1) throw new TypeError('invalid "' + op.type + '"');
    if (!op.key) throw new TypeError('key is required');
  });

  return new Promise(function (resolve, reject) {
    var tr = db.transaction(storeName, 'readwrite');
    var store = tr.objectStore(storeName);
    var results = [];
    var currentIndex = 0;

    tr.onerror = tr.onabort = handleError(reject);
    tr.oncomplete = function () {
      return resolve(results);
    };
    next();

    function next() {
      var _ops$currentIndex = ops[currentIndex];
      var type = _ops$currentIndex.type;
      var key = _ops$currentIndex.key;

      if (type === 'del') return request(store.delete(key));

      var val = ops[currentIndex].val || ops[currentIndex].value;

      if (store.keyPath) {
        if (typeof val !== 'undefined') {
          val[store.keyPath] = key;
        } else {
          val = key;
        }
      }

      countUniqueIndexes(store, val, function (err, uniqueRecordsCounter) {
        if (err) return reject(err);
        if (uniqueRecordsCounter) return reject(new Error('Unique index ConstraintError'));
        request(store.keyPath ? store[type](val) : store[type](val, key));
      });
    }

    function request(req) {
      currentIndex += 1;

      req.onerror = handleError(reject);
      req.onsuccess = function (e) {
        results.push(e.target.result);
        if (currentIndex < ops.length) next();
      };
    }
  });
}

function countUniqueIndexes(store, val, cb) {
  // rely on native support
  if (!isSafari && global.indexedDB !== global.shimIndexedDB) return cb();

  var indexes = slice.call(store.indexNames).map(function (indexName) {
    var index = store.index(indexName);
    var indexVal = isCompound(index) ? map.call(index.keyPath, function (indexKey) {
      return val[indexKey];
    }).filter(function (v) {
      return Boolean(v);
    }) : val[index.keyPath];

    return [index, indexVal];
  }).filter(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var index = _ref2[0];
    var indexVal = _ref2[1];

    return index.unique && (isCompound(index) ? indexVal.length : indexVal);
  });

  if (!indexes.length) return cb();

  var totalRequestsCounter = indexes.length;
  var uniqueRecordsCounter = 0;

  indexes.forEach(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2);

    var index = _ref4[0];
    var indexVal = _ref4[1];

    var req = index.getKey(indexVal);
    req.onerror = handleError(cb);
    req.onsuccess = function (e) {
      if (e.target.result) uniqueRecordsCounter += 1;
      totalRequestsCounter -= 1;
      if (totalRequestsCounter === 0) cb(null, uniqueRecordsCounter);
    };
  });
}

function isCompound(index) {
  return typeof index.keyPath !== 'string';
}

function handleError(cb) {
  return function (e) {
    // prevent global error throw https://bugzilla.mozilla.org/show_bug.cgi?id=872873
    if (typeof e.preventDefault === 'function') e.preventDefault();
    cb(e.target.error);
  };
}
module.exports = exports['default'];