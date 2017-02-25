const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const utils = require('../.././src/app/js/utils');
const path = require('path');

describe('Get apps details', function () {
  it('getAppInfo() returns correct app details', function () {
    let appPath = path.resolve(path.join(__dirname, '..', 'test_data', 'Applications', 'Safari.app'));
    let expectedAppInfo = {
      'display_name': 'Safari',
      'executable': 'Safari',
      'icns': path.join(appPath, 'Contents/Resources/compass.icns'),
      'identifier': 'com.apple.Safari',
      'is_browser': true,
      'name': 'Safari',
      'path': appPath,
      'schemes': ['http']
    };
    let result = utils.getAppInfo(appPath);
    expect(result).to.deep.equal(expectedAppInfo);
  });

  it('getApps() returns correct list of apps and ignores Calculator.app', function () {
    let appsRoot = path.resolve(path.join(__dirname, '..', 'test_data', 'Applications'));
    let expectedResult = [
      {
        'display_name': 'Google Chrome',
        'executable': 'Google Chrome',
        'icns': path.join(appsRoot, 'Google Chrome.app/Contents/Resources/app.icns'),
        'identifier': 'com.google.Chrome',
        'is_browser': true,
        'name': 'Chrome',
        'path': path.join(appsRoot, 'Google Chrome.app'),
        'schemes': ['http']
      },
      {
        'display_name': 'Safari',
        'executable': 'Safari',
        'icns': path.join(appsRoot, 'Safari.app/Contents/Resources/compass.icns'),
        'identifier': 'com.apple.Safari',
        'is_browser': true,
        'name': 'Safari',
        'path': path.join(appsRoot, 'Safari.app'),
        'schemes': ['http']
      }
    ];
    let result = utils.getApps(appsRoot);
    expect(result).to.deep.equal({errors: [], results: expectedResult});
  });
});
