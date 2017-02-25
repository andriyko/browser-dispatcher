'use strict';

const COMMON = {
  APP_NAME: 'BrowserDispatcher'
};

const CONDITION_OPERATOR = {
  IS: 'is',
  IS_NOT: 'is_not',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  NOT_STARTS_WITH: 'not_starts_with',
  ENDS_WITH: 'ends_with',
  NOT_ENDS_WITH: 'not_ends_with',
  REGEX: 'regular_expression'
};

const CONDITION_OPERAND = {
  URL: 'url',
  APP: 'app',
  HOST: 'host',
  SCHEME: 'scheme',
  PATH: 'path',
  PORT: 'port',
  EXTENSION: 'extension'
};

const RULE_OPERATOR = {
  ALL: 'all',
  ANY: 'any'
};

const STATUS = {
  IS_APP_ENABLED: 'is_app_enabled',
  IS_DEV_MODE: 'is_dev_mode',
  IS_USE_DEFAULT: 'is_use_default'
};

module.exports = {
  'COMMON': COMMON,
  'RULE_OPERATOR': RULE_OPERATOR,
  'CONDITION_OPERATOR': CONDITION_OPERATOR,
  'CONDITION_OPERAND': CONDITION_OPERAND,
  'STATUS': STATUS
};
