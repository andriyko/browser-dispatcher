'use strict';

const electron = require('electron');
const {remote, ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;
const signals = require('./src/app/js/signals');

const myApp2 = angular.module('myApp2', ['ngSanitize', 'ngMaterial', 'ngMessages']);

myApp2.controller('MainCtrl2', function ($scope) {
  // General error listener that exposes errors from node.js to AngularJS
  ipcRenderer.on(signals.response(signals.GENERAL.ERROR), (event, error) => {
    console.error(error);
    dialog.showErrorBox('Error', error)
  });

  $scope.applications = [];
  $scope.icons = [];
  $scope.urls = [];

  $scope.win = null;

  // Load URL that should be opened
  ipcRenderer.on(signals.response(signals.GENERAL.LOAD_URL), (event, arg) => {
    $scope.urls = [arg];
    $scope.showWin();
  });

  // Icons: listeners
  ipcRenderer.on(signals.response(signals.ICON.READ), (event, arg) => {
    let sizeToName = {
      'icon_16x16.png': 'mini',
      'icon_32x32.png': 'small',
      'icon_32x32@2x.png': 'medium',
      'icon_128x128.png': 'large'
    };
    arg.forEach(result => {
      if (!$scope.icons[result.application]) {
        $scope.icons[result.application] = {};
      }
      let alias = sizeToName[result.name];
      if (alias) {
        $scope.icons[result.application][alias] = result.content;
      }
    });
    $scope.$apply();
  });

  // Icons: event emitters
  $scope.getIcons = function () {
    ipcRenderer.send(signals.request(signals.ICON.READ), {query: {}, options: {populate: false}});
  };

  ipcRenderer.on(signals.response(signals.APPLICATION.READ), (event, arg) => {
    $scope.applications.splice(0, $scope.applications.length); // keep the reference to the array
    for (let application of arg) {
      $scope.applications.push(application);
    }
    $scope.$apply();
  });

  $scope.getApplications = function () {
    ipcRenderer.send(signals.request(signals.APPLICATION.READ), {});
  };

  $scope.openApplication = function (application) {
    ipcRenderer.send(
      signals.request(signals.GENERAL.OPEN_URL),
      {application: application, url: $scope.urls[0]}
    );
  };

  $scope.getApplications();
  $scope.getIcons();

  $scope.hideWin = function () {
    $scope.win = $scope.win || remote.getCurrentWindow();
    if ($scope.win && $scope.win.isVisible()) {
      $scope.win.hide();
    }
  };

  $scope.getWin = function () {
    $scope.win = remote.getCurrentWindow();
    let {width, height} = electron.screen.getPrimaryDisplay().workArea;
    let {x, y} = electron.screen.getCursorScreenPoint();
    // width +50 for left & right padding
    let w = Math.min($scope.applications.length * 42 + 50, 800);
    let h = 100;
    let x2 = x - Math.round(w / 2);
    let y2 = y - h;

    // make sure that the pop-up window is within the screen area
    x2 = Math.max(x2, 0);
    x2 = Math.min((x2 + w), width) - w;

    y2 = Math.max(y2, 0);
    y2 = Math.min((y2 + h), height) - h;

    $scope.win.setSize(w, h);
    $scope.win.setPosition(x2, y2);
  };

  $scope.showWin = function () {
    if (!$scope.win) {
      $scope.getWin();
    }
    if (!$scope.win.isVisible()) {
      $scope.win.show();
      $scope.win.focus();
    }
  };

  $scope.$watch('applications', () => {
    $scope.getWin();
  }, true);
});
