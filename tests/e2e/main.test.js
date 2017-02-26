'use strict';

const fs = require('fs');
const path = require('path');
const Application = require('spectron').Application;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const electronPath = require('electron');

const TIMEOUT = process.env.CI ? 30000 : 10000;
const ACTION_TIMEOUT = 1500;
const MAIN_JS = path.resolve(path.join(__dirname, '..', '..', 'main.js'));
const USER_DATA_PATH = path.join(process.env.HOME, 'Library', 'Application Support', 'Electron');
const USER_DATA_PATH_DB = path.join(USER_DATA_PATH, 'databases');
const APPS_ROOT_FAKE = path.resolve(path.join(__dirname, '..', 'test_data', 'Applications'));

let deleteDatabaseFile = function (fpath) {
  if (fs.existsSync(fpath) && fs.statSync(fpath).isFile()) {
    fs.unlinkSync(fpath);
  }
};

let clearDatabaseFiles = function () {
  for (let fp of [
    path.join(USER_DATA_PATH_DB, 'applications.db'),
    path.join(USER_DATA_PATH_DB, 'icons.db'),
    path.join(USER_DATA_PATH_DB, 'rules.db'),
    path.join(USER_DATA_PATH_DB, 'settings.db')
  ]) {
    deleteDatabaseFile(fp);
  }
};

global.before(function () {
  chai.should();
  chai.use(chaiAsPromised);
});

describe('BrowserDispatcher', function () {
  this.timeout(TIMEOUT);

  before(function () {
    process.env.BROWSER_DISPATCHER_APPS_ROOT = APPS_ROOT_FAKE;
    process.env.RUNNING_IN_SPECTRON = true;
    clearDatabaseFiles();
  });

  after(function () {
    delete process.env.BROWSER_DISPATCHER_APPS_ROOT;
    delete process.env.RUNNING_IN_SPECTRON;
    clearDatabaseFiles();
  });

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      args: [MAIN_JS]
    });
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
    return this.app.start();
  });

  afterEach(function () {
    deleteDatabaseFile(path.join(USER_DATA_PATH_DB, 'rules.db'));
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('starts with main window shown', function (done) {
    this.app.client
      .waitUntilWindowLoaded()
      .windowByIndex(0).browserWindow.isVisible().should.eventually.be.true
      .windowByIndex(0).browserWindow.getTitle().should.eventually.equal('Browser Dispatcher')
      .notify(done);
  });

  it('has no rules predefined', function (done) {
    this.app.client
      .isVisible('#noRules').should.eventually.be.true
      .getText('#noRules').should.eventually.equal('There are no rules configured')
      .notify(done);
  });

  it('automatically loads list of available applications', function (done) {
    this.app.client
      .waitUntilWindowLoaded()
      .click('#toolbarActionReloadApps')
      .waitForVisible('#appsList', ACTION_TIMEOUT)
      .isExisting('#noApps').should.eventually.be.false
      .getText('#appItemDisplayName_0').should.eventually.be.oneOf(['Safari', 'Google Chrome'])
      .getText('#appItemIdentifier_0').should.eventually.be.oneOf(['com.apple.Safari', 'com.google.Chrome'])
      .getText('#appItemDisplayName_1').should.eventually.be.oneOf(['Safari', 'Google Chrome'])
      .getText('#appItemIdentifier_1').should.eventually.be.oneOf(['com.apple.Safari', 'com.google.Chrome'])
      .isExisting('#appDisplayName_2').should.eventually.be.false
      .notify(done);
  });

  it('adds simple rule', function (done) {
    let ruleName = 'My Test Rule';
    let conditionText = 'google.com';
    this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible('#noRules', ACTION_TIMEOUT).should.be.fulfilled
      .click('#toolbarActionAddNew')
      .waitForVisible('#editRule', ACTION_TIMEOUT).should.be.fulfilled
      .setValue('#editRuleName', ruleName)
      .getValue('#editRuleName').should.eventually.equal(ruleName)
      .setValue('#editConditionText_0', conditionText)
      .getValue('#editConditionText_0').should.eventually.equal(conditionText)
      .click('#toolbarActionSave')
      .waitForVisible('#rulesList', ACTION_TIMEOUT).should.be.fulfilled
      .getText('#ruleItemName_0').should.eventually.equal(ruleName)
      .getText('#ruleItemConditions_0').should.eventually.equal('1 condition')
      .getAttribute('#ruleItemAppLogo_0', 'alt').should.eventually.equal('Safari logo').and
      .notify(done);
  });

  it('configures advanced rule', function (done) {
    let ruleName = 'My Test Rule';
    this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible('#noRules', ACTION_TIMEOUT).should.be.fulfilled
      .click('#toolbarActionAddNew')
      .waitForVisible('#editRule', ACTION_TIMEOUT).should.be.fulfilled
      .selectByValue('#editRuleOperator', 'all')
      .setValue('#editRuleName', ruleName)
      .selectByValue('#editConditionOperand_0', 'host')
      .selectByValue('#editConditionOperator_0', 'is')
      .setValue('#editConditionText_0', 'github.com')
      .click('#editConditionActionAdd_0')
      .waitForVisible('#editConditionText_1', ACTION_TIMEOUT).should.be.fulfilled
      .selectByValue('#editConditionOperand_1', 'path')
      .selectByValue('#editConditionOperator_1', 'starts_with')
      .setValue('#editConditionText_1', '/andriyko/')
      .selectByVisibleText('#editRuleApplication', 'Google Chrome')
      .click('#editRuleAdvancedSettingsOpenNewInstance')
      .click('#toolbarActionSave')
      .waitForVisible('#rulesList', ACTION_TIMEOUT).should.be.fulfilled
      .getText('#ruleItemName_0').should.eventually.equal(ruleName)
      .getText('#ruleItemConditions_0').should.eventually.equal('All 2 conditions must match')
      .getAttribute('#ruleItemAppLogo_0', 'alt').should.eventually.equal('Google Chrome logo')
      .click('#ruleItem_0')
      .waitForVisible('#editRule', ACTION_TIMEOUT).should.be.fulfilled
      .getValue('#editRuleName').should.eventually.equal(ruleName)
      .getValue('#editRuleOperator').should.eventually.equal('all')
      .getValue('#editConditionOperand_0').should.eventually.equal('host')
      .getValue('#editConditionOperator_0').should.eventually.equal('is')
      .getValue('#editConditionText_0').should.eventually.equal('github.com')
      .getValue('#editConditionOperand_1').should.eventually.equal('path')
      .getValue('#editConditionOperator_1').should.eventually.equal('starts_with')
      .getValue('#editConditionText_1').should.eventually.equal('/andriyko/')
      .getValue('#editRuleAdvancedSettingsOpenNewInstance').should.eventually.equal('on')
      .notify(done);
  });

  it('edits rule', function (done) {
    let ruleName = 'My Test Rule';
    let conditionText = 'google.com';
    this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible('#noRules', ACTION_TIMEOUT).should.be.fulfilled
      .click('#toolbarActionAddNew')
      .waitForVisible('#editRule', ACTION_TIMEOUT).should.be.fulfilled
      .setValue('#editRuleName', ruleName)
      .getValue('#editRuleName').should.eventually.equal(ruleName)
      .setValue('#editConditionText_0', conditionText)
      .getValue('#editConditionText_0').should.eventually.equal(conditionText)
      .click('#toolbarActionSave')
      .waitForVisible('#rulesList', ACTION_TIMEOUT).should.be.fulfilled
      .click('#ruleItem_0')
      .waitForVisible('#editRule', ACTION_TIMEOUT).should.be.fulfilled
      .setValue('#editRuleName', `${ruleName} Edited`)
      .getValue('#editRuleName').should.eventually.equal(`${ruleName} Edited`)
      .setValue('#editConditionText_0', `${conditionText}.ua`)
      .getValue('#editConditionText_0').should.eventually.equal(`${conditionText}.ua`)
      .click('#editConditionActionAdd_0')
      .setValue('#editConditionText_1', conditionText)
      .getValue('#editConditionText_1').should.eventually.equal(conditionText)
      .click('#toolbarActionSave')
      .waitForVisible('#rulesList', ACTION_TIMEOUT).should.be.fulfilled
      .getText('#ruleItemName_0').should.eventually.equal(`${ruleName} Edited`)
      .getText('#ruleItemConditions_0').should.eventually.equal('Any 2 conditions must match').and
      .notify(done);
  });

  it('deletes rule', function (done) {
    let ruleName = 'My Test Rule';
    let conditionText = 'google.com';
    this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible('#noRules', ACTION_TIMEOUT).should.be.fulfilled
      .click('#toolbarActionAddNew')
      .waitForVisible('#editRule', ACTION_TIMEOUT).should.be.fulfilled
      .setValue('#editRuleName', ruleName)
      .setValue('#editConditionText_0', conditionText)
      .click('#toolbarActionSave')
      .waitForVisible('#rulesList', ACTION_TIMEOUT).should.be.fulfilled
      .click('#ruleItem_0')
      .click('#toolbarActionDelete')
      .waitForVisible('#noRules', ACTION_TIMEOUT).should.be.fulfilled
      .notify(done);
  });

  it('enables/disables the application', function (done) {
    this.app.client
      .waitUntilWindowLoaded()
      .click('#toolbarActionReloadSettings')
      .waitForVisible('#editSettings', ACTION_TIMEOUT).should.be.fulfilled
      .isSelected('#editSettingsAppStatus').should.eventually.be.true
      .isSelected('#editSettingsAppUseDefault').should.eventually.be.false
      .click('#editSettingsAppStatus')
      .click('#toolbarActionSave')
      .click('#toolbarActionReloadRules')
      .waitForVisible('#noRules', ACTION_TIMEOUT).should.be.fulfilled
      .click('#toolbarActionReloadSettings')
      .isSelected('#editSettingsAppStatus').should.eventually.be.false
      .notify(done);
  });
});
