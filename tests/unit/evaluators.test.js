'use strict';

const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const evaluators = require('../.././src/app/js/evaluators');

let TEST_STRING = 'test';

let RULE_SIMPLE_ANY_CONDITION = {
  _id: 'c0GunX7bGVp6azrw',
  name: 'Integrations',
  is_active: true,
  operator: 'any',
  browser: {
    _id: 'Cat1TxlqAgair0BQ',
    name: 'Safari',
    path: '/Applications/Safari.app',
    icns: '/Applications/Safari.app/Contents/Resources/compass.icns',
    display_name: 'Safari',
    executable: 'Safari',
    identifier: 'com.apple.Safari',
    is_default: true,
    is_active: true
  },
  open_new_instance: false,
  open_not_foreground: false,
  open_fresh: false,
  use_app_executable: false,
  open_args: '',
  conditions: [
    {
      text: 'salesforce.com',
      operand: 'host',
      operator: 'contains'
    },
    {
      text: 'developerforce.com',
      operand: 'host',
      operator: 'contains'
    },
    {
      text: 'service-now.com',
      operand: 'host',
      operator: 'contains'
    },
    {
      text: 'my.okta.com',
      operand: 'host',
      operator: 'is'
    },
    {
      text: 'console.aws.amazon.com',
      operand: 'host',
      operator: 'is'
    }
  ]
};

let RULE_SIMPLE_ALL_CONDITIONS = {
  _id: 'cxrzMcPAACGvGXtH',
  name: 'andriyko Github',
  is_active: true,
  operator: 'all',
  browser: {
    _id: 'REIbACm6FRbU1SHH',
    name: 'Opera',
    path: '/Applications/Opera.app',
    icns: '/Applications/Opera.app/Contents/Resources/app.icns',
    display_name: 'Opera',
    executable: 'Opera',
    identifier: 'com.operasoftware.Opera',
    is_default: false,
    is_active: true
  },
  open_new_instance: false,
  open_not_foreground: false,
  open_fresh: false,
  use_app_executable: false,
  open_args: '',
  conditions: [
    {
      text: 'github.com',
      operand: 'host',
      operator: 'is' },
    {
      text: '/andriyko',
      operand: 'path',
      operator: 'starts_with'
    }
  ]
};

let RULE_ADVANCED_OPTIONS = {
  _id: 'S4H1HASJ8FB41WwQ',
  name: 'Social',
  is_active: true,
  operator: 'any',
  browser: {
    _id: 'AcWgWPZbo7SPP5lY',
    name: 'Firefox',
    path: '/Applications/Firefox.app',
    icns: '/Applications/Firefox.app/Contents/Resources/firefox.icns',
    display_name: 'Firefox',
    executable: 'firefox',
    identifier: 'org.mozilla.firefox',
    is_default: false,
    is_active: true
  },
  open_new_instance: true,
  open_not_foreground: false,
  open_fresh: false,
  use_app_executable: false,
  open_args: '-P “SocialNetworking”',
  conditions: [
    {
      text: 'facebook.com',
      operand: 'host',
      operator: 'is'
    },
    {
      text: 'instagram.com',
      operand: 'host',
      operator: 'is'
    },
    {
      text: 'linkedin.com',
      operand: 'host',
      operator: 'is'
    },
    {
      text: 'reddit.com',
      operand: 'host',
      operator: 'is'
    }
  ]
};

let RULE_INACTIVE = {
  _id: 'oeJGcxq5zvGAuskW',
  name: 'Local Dev',
  is_active: false,
  operator: 'any',
  browser: {
    _id: 'XlJxf2AIAGFdtZ2J',
    name: 'Chrome',
    path: '/Applications/Google Chrome.app',
    icns: '/Applications/Google Chrome.app/Contents/Resources/app.icns',
    display_name: 'Google Chrome',
    executable: 'Google Chrome',
    identifier: 'com.google.Chrome',
    is_default: false,
    is_active: true
  },
  open_new_instance: false,
  open_not_foreground: false,
  open_fresh: false,
  use_app_executable: false,
  open_args: '',
  conditions: [
    {
      text: '15672',
      operand: 'port',
      operator: 'is'
    },
    {
      text: '5555',
      operand: 'port',
      operator: 'is'
    },
    {
      text: '5601',
      operand: 'port',
      operator: 'is'
    },
    {
      text: '6555',
      operand: 'port',
      operator: 'is'
    },
    {
      text: '6543',
      operand: 'port',
      operator: 'is'
    },
    {
      text: '6545',
      operand: 'port',
      operator: 'is'
    }
  ]
};

let RULES = [
  RULE_SIMPLE_ANY_CONDITION,
  RULE_SIMPLE_ALL_CONDITIONS,
  RULE_ADVANCED_OPTIONS,
  RULE_INACTIVE
];

describe('Operands', function () {
  describe('OperandApp', function () {
    it('supportedOperators() of OperandApp returns correct list of operators', function () {
      expect(evaluators._OperandApp.uid).to.be.equal('app');
      expect(evaluators._OperandApp.supportedOperators).to.deep.equal(['is', 'is_not']);
    });
  });

  describe('OperandHost', function () {
    it('supportedOperators() of OperandHost returns correct list of operators', function () {
      expect(evaluators._OperandHost.uid).to.be.equal('host');
      expect(evaluators._OperandHost.supportedOperators).to.deep.equal([
        'is',
        'is_not',
        'contains',
        'not_contains',
        'starts_with',
        'not_starts_with',
        'ends_with',
        'not_ends_with']);
    });
  });

  describe('OperandScheme', function () {
    it('supportedOperators() of OperandScheme returns correct list of operators', function () {
      expect(evaluators._OperandScheme.uid).to.be.equal('scheme');
      expect(evaluators._OperandScheme.supportedOperators).to.deep.equal(['is', 'is_not']);
    });
  });

  describe('OperandPath', function () {
    it('supportedOperators() of OperandPath returns correct list of operators', function () {
      expect(evaluators._OperandPath.uid).to.be.equal('path');
      expect(evaluators._OperandPath.supportedOperators).to.deep.equal([
        'is',
        'is_not',
        'contains',
        'not_contains',
        'starts_with',
        'not_starts_with',
        'ends_with',
        'not_ends_with']);
    });
  });

  describe('OperandPort', function () {
    it('supportedOperators() of OperandPort returns correct list of operators', function () {
      expect(evaluators._OperandPort.uid).to.be.equal('port');
      expect(evaluators._OperandPort.supportedOperators).to.deep.equal(['is', 'is_not']);
    });
  });

  describe('OperandExtension', function () {
    it('supportedOperators() of OperandExtension returns correct list of operators', function () {
      expect(evaluators._OperandExtension.uid).to.be.equal('extension');
      expect(evaluators._OperandExtension.supportedOperators).to.deep.equal(['is', 'is_not']);
    });
  });

  describe('OperandUrl', function () {
    it('supportedOperators() of OperandUrl returns correct list of operators', function () {
      expect(evaluators._OperandUrL.uid).to.be.equal('url');
      expect(evaluators._OperandUrL.supportedOperators).to.deep.equal(['regular_expression']);
    });
  });

  describe('getConditionOperands', function () {
    it('getConditionOperators() should return mapping of operands classes', function () {
      let ops = evaluators.getConditionOperands();
      let keys = ['host', 'scheme', 'path', 'port', 'url'];
      expect(ops).to.be.an('object');
      expect(ops).to.have.all.keys(keys);
    });
  });
});

describe('Operators', function () {
  describe('OperatorIs', function () {
    it('evaluate() should check values equality', function () {
      let operatorIs = new evaluators._OperatorIs(TEST_STRING);
      expect(operatorIs.evaluate('not test')).to.be.false;
      expect(operatorIs.evaluate('test')).to.be.true;
      expect(operatorIs.evaluate(' test ')).to.be.true;
      expect(operatorIs.evaluate('TeSt')).to.be.true;
    });
  });

  describe('OperatorIsNot', function () {
    it('evaluate() should check values inequality', function () {
      let operatorIsNot = new evaluators._OperatorIsNot(TEST_STRING);
      expect(operatorIsNot.evaluate('not test')).to.be.true;
      expect(operatorIsNot.evaluate('test')).to.be.false;
      expect(operatorIsNot.evaluate(' test ')).to.be.false;
      expect(operatorIsNot.evaluate('TeSt')).to.be.false;
    });
  });

  describe('OperatorContains', function () {
    it('evaluate() should check value contains string', function () {
      let operatorContains = new evaluators._OperatorContains(TEST_STRING);
      expect(operatorContains.evaluate('not test')).to.be.true;
      expect(operatorContains.evaluate('  test  ')).to.be.true;
      expect(operatorContains.evaluate('TeSt')).to.be.true;
      expect(operatorContains.evaluate('nottest')).to.be.true;
      expect(operatorContains.evaluate('tteest')).to.be.false;
    });
  });

  describe('OperatorNotContains', function () {
    it('evaluate() should check value does not contain string', function () {
      let operatorNotContains = new evaluators._OperatorNotContains(TEST_STRING);
      expect(operatorNotContains.evaluate('not test')).to.be.false;
      expect(operatorNotContains.evaluate('  test  ')).to.be.false;
      expect(operatorNotContains.evaluate('TeSt')).to.be.false;
      expect(operatorNotContains.evaluate('nottest')).to.be.false;
      expect(operatorNotContains.evaluate('tteest')).to.be.true;
    });
  });

  describe('OperatorStartsWith', function () {
    it('evaluate() should check value starts with string', function () {
      let operatorStartsWith = new evaluators._OperatorStartsWith(TEST_STRING);
      expect(operatorStartsWith.evaluate('not test')).to.be.false;
      expect(operatorStartsWith.evaluate('this is test')).to.be.false;
      expect(operatorStartsWith.evaluate('test this')).to.be.true;
      expect(operatorStartsWith.evaluate('TeSt this')).to.be.true;
      expect(operatorStartsWith.evaluate('testing')).to.be.true;
      expect(operatorStartsWith.evaluate(' testing')).to.be.true;
    });
  });

  describe('OperatorNotStartsWith', function () {
    it('evaluate() should check value does not start with string', function () {
      let operatorNotStartsWith = new evaluators._OperatorNotStartsWith(TEST_STRING);
      expect(operatorNotStartsWith.evaluate('not test')).to.be.true;
      expect(operatorNotStartsWith.evaluate('this is test')).to.be.true;
      expect(operatorNotStartsWith.evaluate('test this')).to.be.false;
      expect(operatorNotStartsWith.evaluate('TeSt this')).to.be.false;
      expect(operatorNotStartsWith.evaluate('testing')).to.be.false;
      expect(operatorNotStartsWith.evaluate(' testing')).to.be.false;
    });
  });

  describe('OperatorEndsWith', function () {
    it('evaluate() should check value ends with string', function () {
      let operatorEndsWith = new evaluators._OperatorEndsWith(TEST_STRING);
      expect(operatorEndsWith.evaluate('this is test')).to.be.true;
      expect(operatorEndsWith.evaluate('another test ')).to.be.true;
      expect(operatorEndsWith.evaluate('test done')).to.be.false;
      expect(operatorEndsWith.evaluate('tests')).to.be.false;
      expect(operatorEndsWith.evaluate('testing')).to.be.false;
      expect(operatorEndsWith.evaluate('tester')).to.be.false;
    });
  });

  describe('OperatorNotEndsWith', function () {
    it('evaluate() should check value ends with string', function () {
      let operatorNotEndsWith = new evaluators._OperatorNotEndsWith(TEST_STRING);
      expect(operatorNotEndsWith.evaluate('this is test')).to.be.false;
      expect(operatorNotEndsWith.evaluate('another test ')).to.be.false;
      expect(operatorNotEndsWith.evaluate('test done')).to.be.true;
      expect(operatorNotEndsWith.evaluate('tests')).to.be.true;
      expect(operatorNotEndsWith.evaluate('testing')).to.be.true;
      expect(operatorNotEndsWith.evaluate('tester')).to.be.true;
    });
  });

  describe('OperatorRegexp', function () {
    it('evaluate() should check value ends with string', function () {
      // eslint-disable-next-line no-useless-escape
      let operatorRegexp = new evaluators._OperatorRegexp('^(http|https)\:\/\/\\w+\.');
      expect(operatorRegexp.evaluate('http://google.com')).to.be.true;
      expect(operatorRegexp.evaluate('https://google.com')).to.be.true;
      expect(operatorRegexp.evaluate('ftp://mozzila.com')).to.be.false;
    });
  });

  describe('getConditionOperators', function () {
    it('getConditionOperators() should return mapping of operators classes', function () {
      let ops = evaluators.getConditionOperators();
      let keys = ['is', 'contains', 'starts_with', 'ends_with', 'is_not',
        'not_contains', 'not_starts_with', 'not_ends_with', 'regular_expression'];
      expect(ops).to.be.an('object');
      expect(ops).to.have.all.keys(keys);
    });
  });
});

describe('RuleEvaluator', function () {
  it('_evaluateCondition() should return boolean', function () {
    let conditionToEvaluate = {
      text: 'google.com',
      operand: 'host',
      operator: 'is'
    };
    let objectToEvaluate = {
      host: 'notgoogle.com',
      scheme: 'https:',
      path: '/',
      port: '443'
    };
    let RuleEvaluator = new evaluators._RuleEvaluator({});

    expect(RuleEvaluator._evaluateCondition(conditionToEvaluate, objectToEvaluate)).to.be.false;

    objectToEvaluate['host'] = conditionToEvaluate['text'];
    expect(RuleEvaluator._evaluateCondition(conditionToEvaluate, objectToEvaluate)).to.be.true;
  });

  it('_any() should return true if at least one of the rule conditions match the evaluated object', function () {
    let objectToEvaluate = {
      host: 'console.aws.amazon.com',
      scheme: 'https:',
      path: '/',
      port: '443'
    };
    let RuleEvaluator = new evaluators._RuleEvaluator(RULE_SIMPLE_ANY_CONDITION);
    expect(RuleEvaluator._any(objectToEvaluate)).to.be.true;

    objectToEvaluate['host'] = 'facebook.com';
    expect(RuleEvaluator._any(objectToEvaluate)).to.be.false;
  });

  it('_all() should return true if all of the rule conditions match the evaluated object', function () {
    let objectToEvaluate = {
      host: 'github.com',
      scheme: 'https:',
      path: '/andriyko',
      port: '443'
    };
    let RuleEvaluator = new evaluators._RuleEvaluator(RULE_SIMPLE_ALL_CONDITIONS);
    expect(RuleEvaluator._all(objectToEvaluate)).to.be.true;

    objectToEvaluate['path'] = '/notandriyko';
    expect(RuleEvaluator._all(objectToEvaluate)).to.be.false;
  });

  it('evaluate() should use _all() or _any() based on the rule operator', function () {
    let objectToEvaluate = {
      host: 'github.com',
      scheme: 'https:',
      path: '/andriyko',
      port: '443'
    };
    let RuleEvaluator = new evaluators._RuleEvaluator(RULE_SIMPLE_ALL_CONDITIONS);
    expect(RuleEvaluator.evaluate(objectToEvaluate)).to.be.true;
  });
});

describe('crateObjectToEvaluate', function () {
  it('crateObjectToEvaluate() should parse URL and transform it to object', function () {
    let expectedResult = {
      host: 'google.com',
      scheme: 'https:',
      path: '/',
      port: '443'
    };
    let result = evaluators.crateObjectToEvaluate('https://google.com:443');
    for (let k of Object.keys(expectedResult)) {
      expect(result[k]).to.be.equal(expectedResult[k]);
    }
  });
});

describe('evaluateRule', function () {
  it('evaluateRule() should return boolean based on the rule evaluation', function () {
    let objectToEvaluate = {
      host: 'github.com',
      scheme: 'https:',
      path: '/andriyko',
      port: '443'
    };
    let result = evaluators.evaluateRule(RULE_SIMPLE_ALL_CONDITIONS, objectToEvaluate);
    expect(result).to.be.true;

    objectToEvaluate['path'] = 'notandriyko';
    result = evaluators.evaluateRule(RULE_SIMPLE_ALL_CONDITIONS, objectToEvaluate);
    expect(result).to.be.false;
  });
});

describe('evaluateRules', function () {
  it('evaluateRules() should evaluate object against all the rules', function () {
    let rule = evaluators.evaluateRules(RULES, 'https://github.com/andriyko');
    expect(rule._id).to.be.equal(RULE_SIMPLE_ALL_CONDITIONS._id);

    rule = evaluators.evaluateRules(RULES, 'https://github.com/notandriyko');
    expect(rule).to.be.equal(null);
  });
});
