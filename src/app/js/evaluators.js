'use strict';

const url = require('url');
const utils = require('./utils');
const CONST = require('./constants');

class BaseOperator {
  constructor (val) {
    this.val = val.trim().toLowerCase();
  }

  _evaluate (val) {
    return false;
  }

  evaluate (val) {
    if (val !== null && val !== undefined) {
      return this._evaluate(val.trim().toLowerCase());
    }
    return false;
  }

  static get uid () {
    return null;
  }
}

class OperatorIs extends BaseOperator {
  _evaluate (val) {
    return this.val === val;
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.IS;
  }
}

class OperatorIsNot extends BaseOperator {
  _evaluate (val) {
    return this.val !== val;
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.IS_NOT;
  }
}

class OperatorContains extends BaseOperator {
  _evaluate (val) {
    return val.indexOf(this.val) > -1;
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.CONTAINS;
  }
}

class OperatorNotContains extends BaseOperator {
  _evaluate (val) {
    return val.indexOf(this.val) === -1;
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.NOT_CONTAINS;
  }
}

class OperatorStartsWith extends BaseOperator {
  _evaluate (val) {
    return new RegExp('^' + this.val, 'i').test(val);
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.STARTS_WITH;
  }
}

class OperatorNotStartsWith extends BaseOperator {
  _evaluate (val) {
    return !(new RegExp('^' + this.val, 'i').test(val));
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.NOT_STARTS_WITH;
  }
}

class OperatorEndsWith extends BaseOperator {
  _evaluate (val) {
    return new RegExp(this.val + '$', 'i').test(val);
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.ENDS_WITH;
  }
}

class OperatorNotEndsWith extends BaseOperator {
  _evaluate (val) {
    return !(new RegExp(this.val + '$', 'i').test(val));
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.NOT_ENDS_WITH;
  }
}

class OperatorRegexp extends BaseOperator {
  _evaluate (val) {
    return new RegExp(this.val, 'i').test(val);
  }
  static get uid () {
    return CONST.CONDITION_OPERATOR.REGEX;
  }
}

function getConditionOperators () {
  let d = {};
  for (let op of [OperatorIs, OperatorContains, OperatorStartsWith, OperatorEndsWith,
    OperatorIsNot, OperatorNotContains, OperatorNotStartsWith, OperatorNotEndsWith,
    OperatorRegexp]) {
    d[op.uid] = op;
  }
  return d;
}

class OperandApp {
  static get uid () {
    return CONST.CONDITION_OPERAND.APP;
  }

  static get supportedOperators () {
    return [OperatorIs.uid, OperatorIsNot.uid];
  }
}

class OperandHost {
  static get uid () {
    return CONST.CONDITION_OPERAND.HOST;
  }

  static get supportedOperators () {
    return [
      OperatorIs.uid, OperatorIsNot.uid, OperatorContains.uid,
      OperatorNotContains.uid, OperatorStartsWith.uid, OperatorNotStartsWith.uid,
      OperatorEndsWith.uid, OperatorNotEndsWith.uid
    ];
  }
}

class OperandScheme {
  static get uid () {
    return CONST.CONDITION_OPERAND.SCHEME;
  }

  static get supportedOperators () {
    return [OperatorIs.uid, OperatorIsNot.uid];
  }
}

class OperandPath {
  static get uid () {
    return CONST.CONDITION_OPERAND.PATH;
  }

  static get supportedOperators () {
    return [
      OperatorIs.uid, OperatorIsNot.uid, OperatorContains.uid,
      OperatorNotContains.uid, OperatorStartsWith.uid, OperatorNotStartsWith.uid,
      OperatorEndsWith.uid, OperatorNotEndsWith.uid
    ];
  }
}

class OperandPort {
  static get uid () {
    return CONST.CONDITION_OPERAND.PORT;
  }

  static get supportedOperators () {
    return [OperatorIs.uid, OperatorIsNot.uid];
  }
}

class OperandExtension {
  static get uid () {
    return CONST.CONDITION_OPERAND.EXTENSION;
  }

  static get supportedOperators () {
    return [OperatorIs.uid, OperatorIsNot.uid];
  }
}

class OperandUrl {
  static get uid () {
    return CONST.CONDITION_OPERAND.URL;
  }

  static get supportedOperators () {
    return [OperatorRegexp.uid];
  }
}

function getConditionOperands () {
  let d = {};
  // d[OperandApp.uid] = OperandApp;
  d[OperandHost.uid] = OperandHost;
  d[OperandScheme.uid] = OperandScheme;
  d[OperandPath.uid] = OperandPath;
  d[OperandPort.uid] = OperandPort;
  d[OperandUrl.uid] = OperandUrl;
  // d[OperandExtension.uid] = OperandExtension;
  return d;
}

function getConditionOperandsObject () {
  let operands = {};

  for (let [key, value] of utils.entries(getConditionOperands())) {
    operands[key] = value.supportedOperators;
  }
  return operands;
}

class RuleEvaluator {
  constructor (rule) {
    this.rule = rule;
  }

  _evaluateCondition (conditionToEvaluate, objectToEvaluate) {
    let operand = getConditionOperands()[conditionToEvaluate.operand];
    let CondClass = getConditionOperators()[conditionToEvaluate.operator];
    let cond = new CondClass(conditionToEvaluate.text);
    let value = objectToEvaluate[operand.uid];
    return cond.evaluate(value);
  }

  _any (objectToEvaluate) {
    let result = false;
    for (let condition of this.rule.conditions) {
      result = this._evaluateCondition(condition, objectToEvaluate);
      if (result) {
        break;
      }
    }
    return result;
  }

  _all (objectToEvaluate) {
    let result = true;
    for (let condition of this.rule.conditions) {
      result = this._evaluateCondition(condition, objectToEvaluate);
      if (!result) {
        break;
      }
    }
    return result;
  }

  evaluate (objectToEvaluate) {
    if (this.rule.operator === CONST.RULE_OPERATOR.ANY) {
      return this._any(objectToEvaluate);
    }
    return this._all(objectToEvaluate);
  }
}

function crateObjectToEvaluate (value, event) {
  let parsedUrl = url.parse(value);
  let result = {};
  // > url.parse('http://google.com:8080')
  // Url {
  //  protocol: 'http:',
  //  slashes: true,
  //  auth: null,
  //  host: 'google.com:8080',
  //  port: '8080',
  //  hostname: 'google.com',
  //  hash: null,
  //  search: null,
  //  query: null,
  //  pathname: '/',
  //  path: '/',
  //  href: 'http://google.com:8080/' }
  // > url.parse('http://google.com:8080/')
  // Url {
  //  protocol: 'http:',
  //  slashes: true,
  //  auth: null,
  //  host: 'google.com:8080',
  //  port: '8080',
  //  hostname: 'google.com',
  //  hash: null,
  //  search: null,
  //  query: null,
  //  pathname: '/',
  //  path: '/',
  //  href: 'http://google.com:8080/' }
  result[OperandUrl.uid] = value;
  result[OperandHost.uid] = parsedUrl.hostname;
  result[OperandScheme.uid] = parsedUrl.protocol;
  result[OperandPath.uid] = parsedUrl.path;
  result[OperandPort.uid] = parsedUrl.port;

  // TODO
  // result[OperandApp.uid] = null;
  // result[OperandExtension.uid] = null;

  return result;
}

function evaluateRule (rule, objectToEvaluate) {
  return new RuleEvaluator(rule).evaluate(objectToEvaluate);
}

function evaluateRules (rules, url, event) {
  let objectToEvaluate = crateObjectToEvaluate(url, event);
  for (let i = 0; i < rules.length; i++) {
    let rule = rules[i];
    if (evaluateRule(rule, objectToEvaluate)) {
      return rule;
    }
  }
  return null;
}

module.exports = {
  '_OperatorIs': OperatorIs,
  '_OperatorIsNot': OperatorIsNot,
  '_OperatorContains': OperatorContains,
  '_OperatorNotContains': OperatorNotContains,
  '_OperatorStartsWith': OperatorStartsWith,
  '_OperatorNotStartsWith': OperatorNotStartsWith,
  '_OperatorEndsWith': OperatorEndsWith,
  '_OperatorNotEndsWith': OperatorNotEndsWith,
  '_OperatorRegexp': OperatorRegexp,

  '_OperandApp': OperandApp,
  '_OperandHost': OperandHost,
  '_OperandScheme': OperandScheme,
  '_OperandPath': OperandPath,
  '_OperandPort': OperandPort,
  '_OperandExtension': OperandExtension,
  '_OperandUrL': OperandUrl,

  '_RuleEvaluator': RuleEvaluator,

  'crateObjectToEvaluate': crateObjectToEvaluate,
  'evaluateRule': evaluateRule,
  'evaluateRules': evaluateRules,
  'getConditionOperators': getConditionOperators,
  'getConditionOperands': getConditionOperands,
  'getConditionOperandsObject': getConditionOperandsObject
};
