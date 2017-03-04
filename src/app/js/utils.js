'use strict';

const fs = require('fs');
const path = require('path');
const plist = require('plist');
const glob = require('glob');

function* entries (obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

function objectValues (obj) {
  return Object.keys(obj).map(key => obj[key]);
}

function _isInArray (arr, val) {
  return arr.some(arrVal => {
    return val === arrVal;
  });
}

function getAppInfo (appPath, onlyBrowsers = true) {
  let plistPath = path.join(appPath, 'Contents', 'Info.plist');
  let plistParsed = plist.parse(fs.readFileSync(plistPath, 'utf8'));
  let urlTypes = plistParsed.CFBundleURLTypes || [];
  let wantedSchemes = ['http', 'https', 'ftp', 'file'];
  let result = { 'is_browser': false, schemes: [] };

  for (let i = 0; i < urlTypes.length; i++) {
    let availableSchemes = urlTypes[i].CFBundleURLSchemes || [];
    for (let j = 0; j < wantedSchemes.length; j++) {
      let wantedScheme = wantedSchemes[i];
      if (_isInArray(availableSchemes, wantedScheme) && result.schemes.indexOf(wantedScheme) === -1) {
        result.schemes.push(wantedScheme);
        result.is_browser = true;
      }
    }
  }
  if (result.is_browser || onlyBrowsers === false) {
    result['identifier'] = plistParsed.CFBundleIdentifier;
    result['display_name'] = plistParsed.CFBundleDisplayName || plistParsed.CFBundleName;
    result['name'] = plistParsed.CFBundleName;
    result['executable'] = plistParsed.CFBundleExecutable;
    let iconFie = plistParsed.CFBundleIconFile.endsWith('.icns') ? plistParsed.CFBundleIconFile : `${plistParsed.CFBundleIconFile}.icns`;
    result['icns'] = path.join(appPath, 'Contents', 'Resources', iconFie);
    result['path'] = appPath;
  }
  return result;
}

function getApps (appsRoot = '/Applications') {
  let result = {errors: [], results: []};
  let appsList = glob('*.app', {'cwd': appsRoot, 'sync': true});
  for (let i = 0; i < appsList.length; i++) {
    let appPath = path.join(appsRoot, appsList[i]);
    try {
      let appInfo = getAppInfo(appPath);
      if (appInfo.is_browser) {
        result.results.push(appInfo);
      }
    } catch (e) {
      result.errors.push(e);
    }
  }
  return result;
}

module.exports = {
  'entries': entries,
  'objectValues': objectValues,
  'getApps': getApps,
  'getAppInfo': getAppInfo
};
