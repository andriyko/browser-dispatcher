'use strict';

const path = require('path');
const Promise = require('bluebird');

const {Document, EmbeddedDocument, connect} = require('camo');

const utils = require('./utils');
const CONST = require('./constants');
const {getLogger} = require('./logger');

class Condition extends EmbeddedDocument {
  constructor () {
    super();

    this.text = {
      type: String,
      required: true
    };
    this.is_active = {
      type: Boolean,
      default: true
    };
    this.operand = {
      type: String,
      choices: utils.objectValues(CONST.CONDITION_OPERAND),
      required: true
    };
    this.operator = {
      type: String,
      choices: utils.objectValues(CONST.CONDITION_OPERATOR),
      required: true
    };
    this.created_on = {
      type: Date,
      default: Date.now
    };
  };

  preValidate () {
    this.created_on = new Date();
    return this;
  };

  static collectionName () {
    return 'conditions';
  };
}

class Icon extends Document {
  constructor () {
    super();

    this.name = {
      required: true,
      type: String
    };
    this.content = {
      required: true,
      type: String
    };
    this.application = {
      required: true,
      type: Application
    };
    this.created_on = {
      type: Date,
      default: Date.now
    };
  }

  preValidate () {
    this.created_on = new Date();
    if (Buffer.isBuffer(this.content)) {
      this.content = this.content.toString('base64');
    }
    return this;
  };

  static collectionName () {
    return 'icons';
  };
}

class Application extends Document {
  constructor () {
    super();

    this.name = {
      unique: true,
      required: true,
      type: String
    };
    this.path = {
      unique: true,
      required: true,
      type: String
    };
    this.icns = {
      unique: true,
      required: true,
      type: String
    };
    this.display_name = {
      required: true,
      type: String
    };
    this.executable = {
      required: true,
      type: String
    };
    this.identifier = {
      unique: true,
      required: true,
      type: String
    };
    this.is_default = {
      type: Boolean,
      default: false
    };
    this.is_active = {
      type: Boolean,
      default: true
    };
    this.created_on = {
      type: Date,
      default: Date.now
    };
  };

  preValidate () {
    this.created_on = new Date();
    return this;
  }

  static collectionName () {
    return 'applications';
  };
}

class Rule extends Document {
  constructor () {
    super();

    this.name = {
      unique: true,
      required: true,
      type: String
    };
    this.is_active = {
      type: Boolean,
      default: true
    };
    this.operator = {
      type: String,
      choices: utils.objectValues(CONST.RULE_OPERATOR),
      required: true
    };
    this.conditions = [Condition];
    this.application = {
      required: true,
      type: Application
    };
    // "-n" option
    // Open a new instance of the application(s) even if one is already running.
    this.open_new_instance = {
      type: Boolean,
      default: false
    };
    // "-g" option
    // Do not bring the application to the foreground.
    this.open_not_foreground = {
      type: Boolean,
      default: false
    };
    // "-F" option.
    // Opens the application "fresh," that is, without restoring windows.
    // Saved persistent state is lost, except for Untitled documents.
    this.open_fresh = {
      type: Boolean,
      default: false
    };
    // "−b" option
    // Use bundle identifier of the application to use when opening the file/uri
    this.use_app_executable = {
      type: Boolean,
      default: false
    };
    // "--args" option.
    // All remaining arguments are passed to the opened application in the argv parameter to main().
    // These arguments are not opened or interpreted by the open tool.
    this.open_args = {
      type: String,
      required: false
    };
    this.created_on = {
      type: Date,
      default: Date.now
    };
  }

  preValidate () {
    this.created_on = new Date();
    if (typeof this.application._id !== 'undefined') {
      this.application = this.application._id;
    }
    return this;
  }

  static collectionName () {
    return 'rules';
  };
}

class Preferences extends Document {
  constructor () {
    super();

    this.name = {
      unique: true,
      required: true,
      type: String
    };
    this.status = {
      default: true,
      type: Boolean
    };
    this.created_on = {
      type: Date,
      default: Date.now
    };
  };

  static init (logger) {
    let initData = {name: CONST.STATUS.IS_APP_ENABLED};
    return this.findOne(initData).then(
      foundData => {
        if (foundData) {
          logger.info(`Skipping initialization of "${this.name}"`);
          return foundData;
        } else {
          let appStatus = this.create(initData);
          let devStatus = this.create({name: CONST.STATUS.IS_DEV_MODE, status: false});
          let useDefault = this.create({name: CONST.STATUS.IS_USE_DEFAULT, status: false});
          Promise.all([appStatus.save(), devStatus.save(), useDefault.save()]).then(
            result => {
              logger.info(`Successfully initialized "${this.name}"`);
              return result;
            },
            error => {
              logger.error(`Failed to initialize "${this.name}". Error: ${error}`);
              return Promise.reject(error);
            }
          );
        }
      },
      error => {
        logger.error(`Failed to initialize "${this.name}". Error: ${error}`);
        return Promise.reject(error);
      }
    );
  };

  static isAppEnabled () {
    return this.findOne({name: CONST.STATUS.IS_APP_ENABLED});
  };

  static enableApp () {
    return this.findOneAndUpdate({name: CONST.STATUS.IS_APP_ENABLED}, {status: true}, {});
  };

  static disableApp () {
    return this.findOneAndUpdate({name: CONST.STATUS.IS_APP_ENABLED}, {status: false}, {});
  };

  static toggleAppStatus () {
    return this.isAppEnabled().then(
      result => {
        if (result.status) {
          return this.disableApp();
        } else {
          return this.enableApp();
        }
      },
      error => {
        return Promise.reject(error);
      }
    );
  };

  preValidate () {
    this.created_on = new Date();
    return this;
  };

  static collectionName () {
    return 'settings';
  }
}

class CamoWrapper {
  constructor (basePath) {
    this._db_uri = `nedb://${path.join(basePath, 'databases/')}`;
    this._logger = getLogger(path.join(basePath, `${CONST.COMMON.APP_NAME}.log`));
    this._db = null;

    this.connect().then(() => {
      this.prefs = Preferences;
      this.icon = Icon;
      this.application = Application;
      this.condition = Condition;
      this.rule = Rule;
    });
  };

  connect () {
    return connect(this._db_uri).then(
      db => {
        this._logger.info('Connected to database');
        this._db = db;
        return this._db;
      },
      error => {
        this._logger.error(error);
        return Promise.reject(error);
      }
    );
  };

  init () {
    return Promise.all([
      this.prefs.init(this._logger)
    ]);
  };
}

module.exports = {
  'Icon': Icon,
  'Condition': Condition,
  'Rule': Rule,
  'Application': Application,
  'Preferences': Preferences,
  'CamoWrapper': CamoWrapper
};
