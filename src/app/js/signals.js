'use strict';

const GENERAL = {
  TEST_URL: 'test-url',
  LOAD_URL: 'load-url',
  OPEN_URL: 'open-url',
  ERROR: 'general-error'
};

const CONFIG = {
  READ_STATUS: 'read-status',
  UPDATE_STATUS: 'update-status',
  READ_IS_USE_DEFAULT: 'read-is-use-default',
  UPDATE_IS_USE_DEFAULT: 'update-is-use-default',
  TOGGLE_APP_STATUS: 'toggle-app-status',
  RESET_ALL: 'reset-all'
};

const APPLICATION = {
  CREATE: 'create-applications',
  READ: 'get-applications',
  UPDATE: 'update-applications',
  DELETE: 'delete-applications',

  CREATE_ONE: 'create-application',
  READ_ONE: 'get-application',
  UPDATE_ONE: 'update-application',
  DELETE_ONE: 'delete-application',

  CLEAR: 'clear-applications',
  UPDATE_DEFAULT: 'update-default-application'
};

const ICON = {
  CREATE: 'create-icons',
  READ: 'get-icons',
  UPDATE: 'update-icons',
  DELETE: 'delete-icons',

  CREATE_ONE: 'create-icon',
  READ_ONE: 'get-icon',
  UPDATE_ONE: 'update-icon',
  DELETE_ONE: 'delete-icon',

  CLEAR: 'clear-icons'
};

const RULE = {
  CREATE: 'create-rules',
  READ: 'get-rules',
  UPDATE: 'update-rules',
  DELETE: 'delete-rules',

  CREATE_ONE: 'create-rule',
  READ_ONE: 'get-rule',
  UPDATE_ONE: 'update-rule',
  DELETE_ONE: 'delete-rule',

  CLEAR: 'clear-rules'
};

function request (signal) {
  return `request-${signal}`;
}

function response (signal) {
  return `response-${signal}`;
}

module.exports = {
  'CONFIG': CONFIG,
  'APPLICATION': APPLICATION,
  'RULE': RULE,
  'ICON': ICON,
  'GENERAL': GENERAL,
  'request': request,
  'response': response
};
