'use strict';

const {remote, ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;

const signals = require('./src/app/js/signals');
const utils = require('./src/app/js/utils');
const evaluators = require('./src/app/js/evaluators');
const CONST = require('./src/app/js/constants');

const myApp = angular.module('myApp', ['ngSanitize']);

myApp.run(function ($rootScope) {
  $rootScope.ctx = {
    _settings: 'settings',
    _rules: 'rules',
    _apps: 'apps',
    _ctx: 'rules',
    _switchCtx: function (ctx) {
      this._ctx = ctx;
    },
    _isCtx: function (ctx) {
      return this._ctx === ctx;
    },
    isSettingsView: function () {
      return this._isCtx(this._settings);
    },
    switchToSettingsView: function () {
      this._switchCtx(this._settings);
    },
    isRulesView: function () {
      return this._isCtx(this._rules);
    },
    switchToRulesView: function () {
      this._switchCtx(this._rules);
    },
    isAppsView: function () {
      return this._isCtx(this._apps);
    },
    switchToAppsView: function () {
      this._switchCtx(this._apps);
    }
  };
  $rootScope.SIGNALS = angular.copy(signals);
});

myApp.service('rulesTester', function ($rootScope) {
  this.data = {
    isTesting: false,
    url: null,
    result: null
  };

  ipcRenderer.on(signals.response(signals.GENERAL.TEST_URL), (event, arg) => {
    this.data.result = arg;
    $rootScope.$apply();
  });

  this.reset = function () {
    this.data.isTesting = false;
    this.data.url = null;
    this.data.result = null;
  };

  this.runTest = function (rules) {
    this.data.isTesting = true;
    ipcRenderer.send(
      signals.request(signals.GENERAL.TEST_URL), {rules: rules, url: this.data.url}
    );
  }
});

myApp.service('storage', function ($rootScope, DEFAULT_CONDITION) {
  this.data = {
    rules: [],
    applications: [],
    icons: {},
    settings: {
      is_app_enabled: false,
      use_default: false,
      default_application: {}
    },
    rule: {},
    application: {}
  };

  this.loadRule = function (data) {
    if (angular.equals({}, data)) {
      // This is new rule
      data = {
        name: `New rule ${this.data.rules.length + 1}`,
        is_active: true,
        open_new_instance: false,
        open_not_foreground: false,
        open_fresh: false,
        open_args: '',
        application: this.data.applications.find(function (application) {
          return application.is_default === true;
        }),
        operator: CONST.RULE_OPERATOR.ANY,
        conditions: [angular.copy(DEFAULT_CONDITION)]
      };
      // We do not need any data from previous rule
      for (let k of Object.keys(this.data.rule)) {
        delete this.data.rule[k];
      }
    }
    // Keep a reference to the object!
    Object.assign(this.data.rule, angular.copy(data));
  };

  this.loadApplication = function (data) {
    if (angular.equals({}, data)) {
      data = {
        name: '',
        path: '',
        icns: '',
        display_name: '',
        executable: '',
        identifier: '',
        is_active: true,
        is_default: false
      };
      // We do not need any data from previous rule
      for (let k of Object.keys(this.data.application)) {
        delete this.data.application[k];
      }
    }
    // Keep a reference to the object!
    Object.assign(this.data.application, angular.copy(data));
  };

  // Settings: listeners
  ipcRenderer.on(signals.response(signals.CONFIG.READ_STATUS), (event, arg) => {
    this.data.settings.is_app_enabled = arg.status;
  });

  ipcRenderer.on(signals.response(signals.CONFIG.UPDATE_STATUS), (event, arg) => {
    this.data.settings.is_app_enabled = arg.status;
  });

  ipcRenderer.on(signals.response(signals.CONFIG.READ_IS_USE_DEFAULT), (event, arg) => {
    this.data.settings.use_default = arg.status;
  });

  ipcRenderer.on(signals.response(signals.CONFIG.UPDATE_IS_USE_DEFAULT), (event, arg) => {
    this.data.settings.use_default = arg.status;
  });

  // Settings: event emitters
  this.getAppStatus = function () {
    ipcRenderer.send(
      signals.request(signals.CONFIG.READ_STATUS),
      {query: {name: CONST.STATUS.IS_APP_ENABLED}}
    );
  };

  this.saveAppStatus = function () {
    ipcRenderer.send(
      signals.request(signals.CONFIG.UPDATE_STATUS),
      {query: {name: CONST.STATUS.IS_APP_ENABLED}, values: {status: this.data.settings.is_app_enabled}}
    );
  };

  this.getIsUseDefault = function () {
    ipcRenderer.send(
      signals.request(signals.CONFIG.READ_IS_USE_DEFAULT),
      {query: {name: CONST.STATUS.IS_USE_DEFAULT}}
    );
  };

  this.saveIsUseDefault = function () {
    ipcRenderer.send(
      signals.request(signals.CONFIG.UPDATE_IS_USE_DEFAULT),
      {query: {name: CONST.STATUS.IS_USE_DEFAULT}, values: {status: this.data.settings.use_default}}
    );
  };

  // Icons: listeners
  ipcRenderer.on(signals.response(signals.ICON.READ), (event, arg) => {
    let sizeToName = {
      'icon_16x16.png': 'mini',
      'icon_32x32.png': 'small',
      'icon_32x32@2x.png': 'medium',
      'icon_128x128.png': 'large'
    };
    arg.forEach(result => {
      if (!this.data.icons[result.application]) {
        this.data.icons[result.application] = {};
      }
      let alias = sizeToName[result.name];
      if (alias) {
        this.data.icons[result.application][alias] = result.content;
      }
    });
    $rootScope.$apply();
  });

  // Icons: event emitters
  this.getIcons = function (query) {
    ipcRenderer.send(signals.request(signals.ICON.READ), {query: query, options: {populate: false}});
  };

  // Rules: listeners
  ipcRenderer.on(signals.response(signals.RULE.READ), (event, arg) => {
    this.data.rules.splice(0, this.data.rules.length); // keep the reference to the array
    for (let rule of arg) {
      this.data.rules.push(rule);
    }
    $rootScope.$apply();
  });

  ipcRenderer.on(signals.response(signals.RULE.CREATE_ONE), (event, arg) => {
    this.getRules();
  });

  ipcRenderer.on(signals.response(signals.RULE.UPDATE_ONE), (event, arg) => {
    this.getRules();
  });

  ipcRenderer.on(signals.response(signals.RULE.DELETE_ONE), (event, arg) => {
    this.getRules();
  });

  ipcRenderer.on(signals.response(signals.RULE.CLEAR), (event, arg) => {
    this.getRules();
  });

  // Rules: event emitters
  this.getRules = function () {
    ipcRenderer.send(signals.request(signals.RULE.READ), {query: {}, options: {populate: true}});
  };

  this.createRule = function (data) {
    ipcRenderer.send(signals.request(signals.RULE.CREATE_ONE), {values: data || this.data.rule});
  };

  this.updateRule = function () {
    ipcRenderer.send(
      signals.request(signals.RULE.UPDATE_ONE),
      {query: {_id: this.data.rule._id}, values: this.data.rule}
    );
  };

  this.deleteRule = function (rule) {
    let query = rule && rule._id ? {_id: rule._id} : {_id: this.data.rule._id};
    ipcRenderer.send(signals.request(signals.RULE.DELETE_ONE), {query: query}
    );
  };

  // Applications: listeners
  ipcRenderer.on(signals.response(signals.APPLICATION.CREATE_ONE), (event, arg) => {
    this.getApplications();
    this.getIcons();
    $rootScope.$apply();
  });

  ipcRenderer.on(signals.response(signals.APPLICATION.UPDATE_DEFAULT), (event, arg) => {
    this.getApplications();
    this.getIcons();
    this.data.settings.default_application = arg;
    $rootScope.$apply();
  });

  ipcRenderer.on(signals.response(signals.APPLICATION.UPDATE_ONE), (event, arg) => {
    this.getApplications();
  });

  ipcRenderer.on(signals.response(signals.APPLICATION.UPDATE), (event, arg) => {
    this.getApplications();
  });

  ipcRenderer.on(signals.response(signals.APPLICATION.DELETE_ONE), (event, arg) => {
    this.getApplications();
    this.getRules();
  });

  ipcRenderer.on(signals.response(signals.APPLICATION.READ), (event, arg) => {
    this.data.applications.splice(0, this.data.applications.length); // keep the reference to the array
    for (let application of arg) {
      this.data.applications.push(application);
    }
    this.data.settings.default_application = this.data.applications.find((application) => {
      return application.is_default === true;
    });
    $rootScope.$apply();
  });

  ipcRenderer.on(signals.response(signals.APPLICATION.CLEAR), (event, arg) => {
    this.getApplications();
    this.getRules();
  });

  // Applications: event emitters
  this.getApplications = function () {
    ipcRenderer.send(signals.request(signals.APPLICATION.READ), {});
  };

  this.deleteApplication = function (application) {
    let query = application && application._id ? {_id: application._id} : {_id: this.data.application._id};
    ipcRenderer.send(signals.request(signals.APPLICATION.DELETE_ONE), {query: query});
  };

  this.createApplication = function () {
    ipcRenderer.send(signals.request(signals.APPLICATION.CREATE_ONE), {values: this.data.application});
  };

  this.updateApplication = function (application) {
    if (!application) {
      application = this.data.application
    }
    ipcRenderer.send(
      signals.request(signals.APPLICATION.UPDATE_ONE),
      {query: {_id: application._id}, values: application}
    );
  };

  this.setDefaultApplication = function () {
    ipcRenderer.send(
      signals.request(signals.APPLICATION.UPDATE_DEFAULT), {query: {_id: this.data.settings.default_application._id}}
    );
  };

  this.resetAll = function () {
    ipcRenderer.sendSync(signals.request(signals.CONFIG.RESET_ALL), {});
  };
});

myApp.service('actions', function () {
  let _canSave = false;
  let _canDelete = false;
  return {
    getCanSave: function () {
      return _canSave;
    },
    setCanSave: function (value) {
      _canSave = value;
    },
    getCanDelete: function () {
      return _canDelete;
    },
    setCanDelete: function (value) {
      _canDelete = value;
    }
  }
});

myApp.filter('capitalize', function () {
  return function (input) {
    if (input) {
      return (input.charAt(0).toUpperCase() + input.slice(1)).split('_').join(' ');
    }
  };
});

myApp.filter('filterRules', function () {
  return function (input, filterCriteria) {
    if (!filterCriteria.text && !filterCriteria.filterByStatus) {
      return input;
    }
    let filterText = filterCriteria.text.toLowerCase();
    let filterByStatus = filterCriteria.filterByStatus;
    return input.filter((i) => {
      return (i.name.toLowerCase().includes(filterText) && (filterByStatus ? i.is_active : true)) ||
        i.conditions.some((c) => {
          return c.text.toLowerCase().includes(filterText);
        }) && (filterByStatus ? i.is_active : true);
    })
  }
});

myApp.filter('filterApps', function () {
  return function (input, filterCriteria) {
    if (!filterCriteria.text && !filterCriteria.filterByStatus) {
      return input;
    }
    let filterText = filterCriteria.text.toLowerCase();
    let filterByStatus = filterCriteria.filterByStatus;
    return input.filter((i) => {
      return (i.name.toLowerCase().includes(filterText) ||
        i.display_name.toLowerCase().includes(filterText) ||
        i.executable.toLowerCase().includes(filterText) ||
        i.identifier.toLowerCase().includes(filterText)) &&
        (filterByStatus ? i.is_active : true);
    })
  }
});

myApp.constant('DEFAULT_CONDITION', {
  'operand': 'host',
  'operator': 'is',
  'text': '',
  'is_active': true
});

myApp.constant('CONDITIONS_OPTIONS', evaluators.getConditionOperandsObject());

myApp.controller('MainCtrl', function ($scope, $rootScope, $q, $timeout, storage, actions, rulesTester) {
  // General error listener that exposes errors from node.js to AngularJS
  ipcRenderer.on(signals.response(signals.GENERAL.ERROR), (event, error) => {
    console.error(error);
    dialog.showErrorBox('Error', error);
  });

  $scope.rules = [];
  $scope.icons = {};
  $scope.applications = [];

  $scope.filterCriteria = {'text': '', 'filterByStatus': false};

  $scope.clearFilterCriteria = function () {
    $scope.filterCriteria.text = '';
    $scope.filterByStatus = false;
  };

  $scope.toggleFilterCriteria = function () {
    $scope.filterCriteria.filterByStatus = !$scope.filterCriteria.filterByStatus;
  };

  // services
  $scope.storage = storage;
  $scope.actions = actions;
  $scope.actions.setCanSave(false);
  $scope.actions.setCanDelete(false);
  $scope.rulesTester = rulesTester;

  $scope._toggleAddAppDialog = function () {
    if (storage.data.application._id) {
      return;
    }
    let opts = {
      title: 'Select application',
      defaultPath: '/Applications',
      filters: [
        {name: 'Applications', extensions: ['app']}
      ],
      properties: ['openFile']
    };
    let selectedApp = dialog.showOpenDialog(remote.getCurrentWindow(), opts);
    if (angular.isDefined(selectedApp) && selectedApp !== null) {
      if (angular.isArray(selectedApp)) {
        selectedApp = selectedApp[0]
      }
      let appInfo = utils.getAppInfo(selectedApp, false);
      storage.data.application.name = appInfo.name;
      storage.data.application.path = appInfo.path;
      storage.data.application.icns = appInfo.icns;
      storage.data.application.display_name = appInfo.display_name;
      storage.data.application.executable = appInfo.executable;
      storage.data.application.identifier = appInfo.identifier;
      storage.data.application.is_active = true;
      storage.data.application.is_default = false;
    }
  };

  $scope.toggleAddAppDialog = function () {
    $timeout(function () {
      $scope._toggleAddAppDialog();
      $scope.$apply();
    }, 500);
  };

  $scope.loadApplication = function (data) {
    storage.loadApplication(data || {});
    actions.setCanSave(false);
  };

  $scope.loadRule = function (data) {
    storage.loadRule(data || {});
    rulesTester.reset();
    actions.setCanSave(false);
  };

  $scope.reloadAppsView = function () {
    $scope.clearFilterCriteria();
    // Sort by date so that the newest item goes first
    storage.data.applications.sort(function (a, b) {
      return new Date(b.created_on).getTime() - new Date(a.created_on).getTime();
    });

    $scope.loadApplication({});
    if (storage.data.applications.length) {
      $scope.loadApplication(storage.data.applications[0])
    }
    $scope.ctx.switchToAppsView();
  };

  $scope.reloadRulesView = function () {
    $scope.clearFilterCriteria();
    // Sort by date so that the newest item goes first
    storage.data.rules.sort(function (a, b) {
      return new Date(b.created_on).getTime() - new Date(a.created_on).getTime();
    });

    $scope.loadRule({});
    if (storage.data.rules.length) {
      $scope.loadRule(storage.data.rules[0])
    }
    rulesTester.reset();
    $scope.ctx.switchToRulesView();
  };

  $scope.reloadSettingsView = function () {
    $scope.clearFilterCriteria();
    $scope.ctx.switchToSettingsView();
  };

  // DB operations
  $scope.getAppStatus = function () {
    storage.getAppStatus();
  };

  $scope.saveAppStatus = function () {
    storage.saveAppStatus();
  };

  $scope.getIsUseDefault = function () {
    storage.getIsUseDefault();
  };

  $scope.saveIsUseDefault = function () {
    storage.saveIsUseDefault();
  };

  $scope.getRules = function () {
    storage.getRules();
  };

  $scope.deleteRule = function (rule) {
    storage.deleteRule(rule);
  };

  $scope.createRule = function () {
    storage.createRule();
  };

  $scope.updateRule = function () {
    storage.updateRule();
  };

  $scope.saveRule = function () {
    if (storage.data.rule && storage.data.rule._id) {
      $scope.updateRule();
    } else {
      $scope.createRule();
    }
  };

  // Icons
  $scope.getIcons = function () {
    storage.getIcons();
  };

  // Applications
  $scope.getApplications = function () {
    storage.getApplications();
  };

  $scope.setDefaultApplication = function () {
    storage.setDefaultApplication();
  };

  $scope.deleteApplication = function (application) {
    storage.deleteApplication(application);
  };

  $scope.createApplication = function () {
    storage.createApplication();
  };

  $scope.updateApplication = function (application) {
    storage.updateApplication(application);
  };

  $scope.resetAll = function () {
    storage.resetAll();
  };

  $scope.saveApplication = function () {
    if (storage.data.application && storage.data.application._id) {
      $scope.updateApplication();
    } else {
      $scope.createApplication();
      $scope.getIcons();
    }
  };

  $scope.load = function () {
    switch (true) {
      case $scope.ctx.isRulesView():
        $scope.loadRule();
        break;
      case $scope.ctx.isAppsView():
        $scope.loadApplication();
        $scope.toggleAddAppDialog();
        break;
      default:
        $scope.reloadRulesView();
        break;
    }
  };

  $scope.save = function () {
    switch (true) {
      case $scope.ctx.isRulesView():
        $scope.saveRule();
        $scope.reloadRulesView();
        break;
      case $scope.ctx.isAppsView():
        $scope.saveApplication();
        $scope.reloadAppsView();
        break;
      case $scope.ctx.isSettingsView():
        $scope.saveAppStatus();
        $scope.saveIsUseDefault();
        $scope.setDefaultApplication();
        break;
      default:
        $scope.reloadRulesView();
        break;
    }
  };

  $scope.cancel = function () {
    switch (true) {
      case $scope.ctx.isAppsView():
        $scope.reloadAppsView();
        break;
      case $scope.ctx.isRulesView():
        $scope.reloadRulesView();
        break;
      case $scope.ctx.isSettingsView():
        $scope.reloadSettingsView();
        break;
      default:
        $scope.reloadRulesView();
        break;
    }
  };

  $scope.delete = function (data) {
    switch (true) {
      case $scope.ctx.isRulesView():
        $scope.deleteRule(data);
        $scope.reloadRulesView();
        break;
      case $scope.ctx.isAppsView():
        $scope.deleteApplication(data);
        $scope.reloadAppsView();
        break;
      case $scope.ctx.isSettingsView():
        $scope.resetAll();
        $scope.reloadSettingsView();
        break;
    }
  };

  $scope.showConfirmDelete = function () {
    // Currently, spectron cannot interact with dialogs so I just skip them during testing.
    // https://github.com/electron/spectron/issues/94
    if (process.env.RUNNING_IN_SPECTRON) {
      $scope.delete();
      return;
    }
    let _textContent = 'The action cannot be undone. Do you want to continue?';
    let _textConfirm = 'Delete';
    let _textTitle = 'Confirm delete';
    let _textDetail = null;
    let canDelete = true;
    switch (true) {
      case $scope.ctx.isRulesView():
        _textDetail = 'Note: It is possible to deactivate a rule, not delete.';
        break;
      case $scope.ctx.isAppsView():
        _textDetail = 'Note: All the rules that use this application will be deleted.';
        canDelete = storage.data.settings.default_application._id !== storage.data.application._id;
        if (!canDelete) {
          _textDetail = 'Note: You can change favorite browser in "Options" tab.';
          _textContent = `Cannot delete ${storage.data.application.display_name} as it is used as a favorite browser.`
        }
        break;
      case $scope.ctx.isSettingsView():
        _textConfirm = 'Reset';
        _textTitle = 'Confirm reset';
        _textDetail = 'Note: This action will clear the application settings including configured applications and rules. ' +
          'Please make a backup of "~/Library/Application Support/BrowserDispatcher/databases" before you proceed.';
        break
    }
    let opts = {
      type: 'warning',
      title: _textTitle,
      message: _textContent,
      detail: _textDetail,
      buttons: canDelete ? [_textConfirm, 'Cancel'] : ['Cancel']
    };

    dialog.showMessageBox(remote.getCurrentWindow(), opts, (idx) => {
      if (opts.buttons.length ===2 && idx === 0) {
        $scope.delete();
      }
    });
  };

  $scope.init = function () {
    $q.all([
      $scope.getAppStatus(),
      $scope.getIsUseDefault(),
      $scope.getRules(),
      $scope.getIcons(),
      $scope.getApplications()
    ]).then(
      () => {
        $scope.rules = storage.data.rules;
        $scope.icons = storage.data.icons;
        $scope.applications = storage.data.applications;

        $scope.reloadRulesView();
      },
      error => {
        console.error(error);
        dialog.showErrorBox('Error', error);
      }
    );
  };

  $scope.$watch('rules', (newValue, oldValue) => {
    if (newValue.length && $scope.ctx.isRulesView()) {
      $scope.reloadRulesView();
    }
  }, true);

  $scope.$watch('applications', (newValue, oldValue) => {
    if (newValue.length && $scope.ctx.isAppsView()) {
      $scope.reloadAppsView();
    }
  }, true);

  $scope.init();
});

myApp.directive('removeCondition', function () {
  return {
    scope: {
      index: '=?'
    },
    link: function ($scope, $element) {
      $element.bind('click', function () {
        $scope.$emit('condition-remove', $scope.index);
      });
    }
  };
});

myApp.directive('toggleCondition', function () {
  return {
    scope: {
      index: '=?'
    },
    link: function ($scope, $element) {
      $element.bind('click', function () {
        $scope.$emit('condition-toggle', $scope.index);
      });
    }
  };
});

myApp.directive('addCondition', function () {
  return {
    scope: {
      index: '=?'
    },
    link: function ($scope, $element) {
      $element.bind('click', function () {
        $scope.$emit('condition-add', $scope.index);
      });
    }
  };
});

myApp.directive('editCondition', function () {
  return {
    restrict: 'E',
    scope: {
      condition: '=?condition',
      index: '=?index'
    },
    replace: true,
    transclude: true,
    templateUrl: './src/app/templates/edit_condition.html',

    controller: function ($scope, CONDITIONS_OPTIONS) {
      let conditionOptions = angular.copy(CONDITIONS_OPTIONS);
      $scope.operands = Object.keys(conditionOptions);
      $scope.operators = conditionOptions[$scope.condition.operand];

      $scope.$watch('condition.operand', function (newValue, oldValue) {
        if (newValue === oldValue) {
          return;
        }
        let operators = conditionOptions[$scope.condition.operand];
        if (!angular.equals($scope.operators, operators)) {
          $scope.operators = conditionOptions[$scope.condition.operand];
          $scope.condition.operator = $scope.operators[0];
        }
      });
    }
  }
});

myApp.controller('SettingsCtrl', function ($scope, storage) {
  // a tiny proxy Controller for storage objects
  $scope.settings = storage.data.settings;
  $scope.applications = storage.data.applications;
  $scope.actions.setCanSave(true);
  $scope.actions.setCanDelete(true);
});

myApp.controller('RuleCtrl', function ($scope, DEFAULT_CONDITION, storage, actions) {
  $scope.rule = storage.data.rule;
  $scope.applications = storage.data.applications;
  $scope.actions = actions;
  $scope.actions.setCanSave(false);
  $scope.actions.setCanDelete(false);

  $scope.show_advanced_settings = $scope.rule.open_args ||
    $scope.rule.open_fresh ||
    $scope.rule.open_new_instance ||
    $scope.rule.open_not_foreground;

  $scope.toggleActive = function () {
    $scope.rule.is_active = !$scope.rule.is_active;
  };

  $scope.isActive = function () {
    return (angular.isDefined($scope.rule) && $scope.rule && $scope.rule.is_active);
  };

  $scope.hasConditions = function () {
    return $scope.rule.conditions.length > 0;
  };

  $scope.$on('condition-add', function (e, index) {
    $scope.rule.conditions.splice(Number.parseInt(index) + 1, 0, angular.copy(DEFAULT_CONDITION));
    $scope.$apply();
  });

  $scope.$on('condition-remove', function (e, index) {
    if ($scope.rule.conditions.length > 1) {
      $scope.rule.conditions.splice(Number.parseInt(index), 1);
      $scope.$apply();
    }
  });

  $scope.$on('condition-toggle', function (e, index) {
    if ($scope.rule.conditions.length > 1) {
      $scope.rule.conditions[index].is_active = !$scope.rule.conditions[index].is_active;
      $scope.$apply();
    }
  });

  $scope.$watch('rule', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      $scope.actions.setCanSave([
        $scope.editRule.$dirty,
        $scope.rule.name,
        $scope.rule.conditions && $scope.rule.conditions.every(function (c) { return c.text; })
      ].every(function (attr) { return attr; }));
      $scope.actions.setCanDelete(angular.isDefined($scope.rule._id));
    }
  }, true);
});

myApp.controller('ApplicationCtrl', function ($scope, $timeout, storage, actions) {
  $scope.application = storage.data.application;
  $scope.actions = actions;
  $scope.actions.setCanSave(false);
  $scope.actions.setCanDelete(false);

  $scope.toggleActive = function () {
    $scope.application.is_active = !$scope.application.is_active;
  };

  $scope.isActive = function () {
    return (angular.isDefined($scope.application) && $scope.application.is_active);
  };

  $scope.$watch('application', (newValue, oldValue) => {
    $scope.actions.setCanDelete(angular.isDefined($scope.application._id));
    $scope.actions.setCanSave([
      // $scope.editApp.$dirty,
      $scope.application.name,
      $scope.application.executable,
      $scope.application.identifier,
      $scope.application.display_name
    ].every(function (attr) { return attr; }));
  }, true)
});
