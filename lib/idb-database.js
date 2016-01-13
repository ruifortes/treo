'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

var _storageEmitter = require('storage-emitter');

var _storageEmitter2 = _interopRequireDefault(_storageEmitter);

var _idbSchema = require('idb-schema');

var _idbSchema2 = _interopRequireDefault(_idbSchema);

var _idbFactory = require('idb-factory');

var _idbStore = require('./idb-store');

var _idbStore2 = _interopRequireDefault(_idbStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Database = function (_Emitter) {
  _inherits(Database, _Emitter);

  /**
   * Initialize new `Database` instance.
   *
   * @param {String} name
   * @param {Schema} schema
   */

  function Database(name, schema) {
    _classCallCheck(this, Database);

    if (typeof name !== 'string') throw new TypeError('"name" is required');
    if (!(schema instanceof _idbSchema2.default)) throw new TypeError('schema is not valid');

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Database).call(this));

    _this.status = 'close';
    _this.origin = null;
    _this.schema = schema;
    _this.opts = schema.stores();
    _this.name = name;
    _this.version = schema.version();
    _this.stores = _this.opts.map(function (store) {
      return store.name;
    });

    _this.stores.forEach(function (storeName) {
      if (typeof _this[storeName] !== 'undefined') return;
      Object.defineProperty(_this, storeName, {
        get: function get() {
          return this.store(storeName);
        }
      });
    });

    if (_this.opts.some(function (store) {
      return store.indexes.some(function (index) {
        return index.multiEntry;
      });
    })) {
      console.warn('MultiEntry index is not supported completely, because it does not work in IE. But it should work in remaining browsers.'); // eslint-disable-line
    }
    return _this;
  }

  /**
   * Close connection && delete database.
   * After close it waits a little to avoid exception in Safari.
   *
   * @return {Promise}
   */

  _createClass(Database, [{
    key: 'del',
    value: function del() {
      _storageEmitter2.default.emit('versionchange', { name: this.name, isDelete: true });
      return (0, _idbFactory.del)(this);
    }

    /**
     * Close database.
     */

  }, {
    key: 'close',
    value: function close() {
      if (this.status !== 'open') return;
      this.origin.close();
      this.origin = null;
      this.status = 'close';
    }

    /**
     * Get store by `name`.
     *
     * @param {String} name
     * @return {Store}
     */

  }, {
    key: 'store',
    value: function store(name) {
      var i = this.stores.indexOf(name);
      if (i === -1) throw new TypeError('invalid store name');
      return new _idbStore2.default(this, this.opts[i]);
    }

    /**
     * Get raw db instance.
     * It initiates opening transaction only once,
     * another requests will be fired on "open" event.
     *
     * @return {Promise} (IDBDatabase)
     */

  }, {
    key: 'getInstance',
    value: function getInstance() {
      var _this2 = this;

      if (this.status === 'open') return Promise.resolve(this.origin);
      if (this.status === 'error') return Promise.reject(new Error('database error'));
      if (this.status === 'opening') return this.promise;

      _storageEmitter2.default.emit('versionchange', { name: this.name, version: this.version });
      this.status = 'opening';
      this.promise = (0, _idbFactory.open)(this.name, this.version, this.schema.callback()).then(function (db) {
        delete _this2.promise;
        _this2.status = 'open';
        _this2.origin = db;

        db.onerror = function (err) {
          return _this2.emit('error', err);
        };
        db.onversionchange = function () {
          _this2.close();
          _this2.emit('versionchange');
        };
        _storageEmitter2.default.once('versionchange', function (_ref) {
          var name = _ref.name;
          var version = _ref.version;
          var isDelete = _ref.isDelete;

          if (_this2.status !== 'close' && name === _this2.name && (version > _this2.version || isDelete)) {
            _this2.close();
            _this2.emit('versionchange');
          }
        });

        return db;
      }).catch(function (err) {
        delete _this2.promise;
        _this2.status = 'error';
        throw err;
      });

      return this.promise;
    }
  }]);

  return Database;
}(_componentEmitter2.default);

exports.default = Database;
module.exports = exports['default'];