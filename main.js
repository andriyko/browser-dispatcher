'use strict';

const fs = require('fs');
const path = require('path');
const iconutil = require('iconutil');
const electron = require('electron');
const {app, dialog, ipcMain, Menu, Tray, BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const Promise = require('bluebird');

const {getLogger} = require('./src/app/js/logger');
const evaluators = require('./src/app/js/evaluators');
const signals = require('./src/app/js/signals');
const docs = require('./src/app/js/docs');
const utils = require('./src/app/js/utils');
const CONST = require('./src/app/js/constants');
const open2 = require('./src/app/js/open2');

app.setName(CONST.COMMON.APP_NAME);

// global object for app tray
let appTray = null;

const logger = getLogger(path.join(app.getPath('userData'), `${CONST.COMMON.APP_NAME}.log`));
const sqlodm = new docs.CamoWrapper(app.getPath('userData'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, secondaryWindow;

let handleRedirect = (e, url) => {
  if (mainWindow && url !== mainWindow.webContents.getURL()) {
    e.preventDefault();
    openUrlInDefaultBrowser(url);
  }
};

function createMainWindow () {
  // Only single main window is allowed
  if (mainWindow) {
    mainWindow.focus();
    return;
  }
  // Create the browser window.
  mainWindow = new BrowserWindow(
    {
      width: 930,
      height: 530,
      resizable: true,
      show: false
    }
  );

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.on('crashed', (event, killed) => {
    logger.error(`The application has crashed. Killed: ${killed}. Event: ${event}`);
    let opts = {
      type: 'info',
      title: 'The application has crashed',
      message: 'This process has crashed',
      buttons: ['Reload', 'Close']
    };
    dialog.showMessageBox(opts, (index) => {
      if (index === 0) {
        mainWindow.reload();
      } else {
        mainWindow.close();
      }
    });
  });

  mainWindow.webContents.on('will-navigate', handleRedirect);
  mainWindow.webContents.on('new-window', handleRedirect);

  mainWindow.on('unresponsive', () => {
    logger.error('The application is not responding');
    let opts = {
      type: 'info',
      title: 'The application is not responding',
      message: 'Reload the window?',
      buttons: ['Reload', 'Cancel']
    };
    require('dialog').showMessageBox(opts, (index) => {
      if (index === 0) {
        mainWindow.reload();
      } else {
        mainWindow.close();
      }
    });
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createSecondaryWindow (url) {
  if (secondaryWindow) {
    secondaryWindow.show();
    secondaryWindow.focus();
  } else {
    let {x, y} = electron.screen.getCursorScreenPoint();
    secondaryWindow = new BrowserWindow(
      {
        x: x,
        y: y,
        closable: true,
        alwaysOnTop: true,
        movable: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        show: false,
        frame: false,
        height: 100,
        width: 499,
        useContentSize: true,
        transparent: true
      }
    );
    secondaryWindow.loadURL(`file://${__dirname}/index2.html`);

    // TODO add appropriate handler
    secondaryWindow.webContents.on('crashed', () => {
      logger.error('The app has crashed', {'window': 'createSecondaryWindow'});
    });

    // TODO add appropriate handler
    secondaryWindow.on('unresponsive', () => {
      logger.error('The app is unresponsive', {'window': 'createSecondaryWindow'});
    });

    // Emitted when the window is closed.
    secondaryWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      secondaryWindow = null;
    });
  }

  secondaryWindow.webContents.on('did-finish-load', () => {
    secondaryWindow.webContents.send(signals.response(signals.GENERAL.LOAD_URL), url);
  });
}

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
}

function buildAppMenu () {
  let template = [
    {
      label: 'Settings',
      enabled: mainWindow === null || mainWindow === undefined,
      click: () => {
        createMainWindow();
      }
    },
    {
      label: 'Preferences',
      submenu: [
        {
          label: 'Open at login',
          type: 'checkbox',
          checked: app.getLoginItemSettings()['openAtLogin'],
          click: () => {
            if (app.getLoginItemSettings()['openAtLogin']) {
              app.setLoginItemSettings({openAtLogin: false, openAsHidden: false});
            } else {
              app.setLoginItemSettings({openAtLogin: true, openAsHidden: true});
            }
          }
        },
        {
          label: 'Make default browser',
          type: 'checkbox',
          checked: app.isDefaultProtocolClient('http'),
          click: () => {
            if (app.isDefaultProtocolClient('http')) {
              app.removeAsDefaultProtocolClient('http');
              app.removeAsDefaultProtocolClient('https');
            } else {
              app.setAsDefaultProtocolClient('http');
              app.setAsDefaultProtocolClient('https');
            }
          }
        }
      ]
    },
    {
      label: 'Edit',
      // visible: mainWindow !== null && mainWindow !== undefined,
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          // visible: mainWindow !== null && mainWindow !== undefined,
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              // on reload, start fresh and close any old
              // open secondary windows
              if (focusedWindow.id === 1) {
                BrowserWindow.getAllWindows().forEach((win) => {
                  if (win.id > 1) {
                    win.close()
                  }
                })
              }
              focusedWindow.reload()
            }
          }
        },
        {
          label: 'Show applications selector',
          accelerator: 'CmdOrCtrl+L',
          click: () => { createSecondaryWindow('http://google.com'); }
        },
        {
          label: 'Toggle Developer Tools',
          // visible: mainWindow !== null && mainWindow !== undefined,
          accelerator: 'Alt+Command+I',
          click: (item, focusedWindow) => {
            // if (focusedWindow && isDev) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools()
            }
          }
        }
      ]
    },
    { type: 'separator' },
    { label: 'About', selector: 'orderFrontStandardAboutPanel:', role: 'about' },
    {
      label: 'Quit',
      accelerator: 'Command+Q',
      selector: 'terminate:',
      click: () => {
        if (mainWindow !== undefined && mainWindow !== null) {
          mainWindow.close();
        }
        app.quit();
      }
    }
  ];
  return Menu.buildFromTemplate(template);
}

function buildTray () {
  if (!appTray) {
    appTray = new Tray(`${__dirname}/src/app/images/tray_icon.png`);
  }
  appTray.setToolTip(CONST.COMMON.APP_NAME);
  // appTray.setContextMenu(buildContextMenu());
  let menu = buildAppMenu();
  Menu.setApplicationMenu(menu);
  appTray.setContextMenu(menu);
}

function autoLoadBrowsers () {
  sqlodm.application.count().then(
    count => {
      if (count === 0) {
        let appsRoot = process.env.BROWSER_DISPATCHER_APPS_ROOT || '/Applications';
        let {results, errors} = utils.getApps(appsRoot);
        if (errors.length) {
          logger.warn(`There were ${errors.length} errors while fetching the list of applications`);
        }
        for (let b of results) {
          if (b.name !== CONST.COMMON.APP_NAME) {
            let application = sqlodm.application.create({
              name: b.name,
              display_name: b.display_name,
              path: b.path,
              icns: b.icns,
              executable: b.executable,
              identifier: b.identifier,
              is_default: (b.name === 'Safari')
            });
            application.save().then(
              result => {
                result = result.toJSON();
                logger.info(`Added application ${result.name}`);
                iconutil.toIconset(b.icns, (err, icons) => {
                  if (!err) {
                    for (let [k, v] of utils.entries(icons)) {
                      sqlodm.icon.create({name: k, application: result._id, content: v}).save().then(
                        ico => {
                          logger.info(`Added icon ${ico.name} for application ${result.name}`);
                        },
                        error => {
                          logger.error(`Failed to add icon for the application "${b.name}". Error: `, error);
                        }
                      );
                    }
                  }
                });
              },
              error => {
                logger.error(`Failed to add application "${b.name}". Error: `, error);
              }
            );
          }
        }
      }
    },
    error => {
      logger.error('Failed to count configured applications. Error: ', error);
    }
  );
}

function appReady () {
  sqlodm.init().then(
    () => {
      logger.info('Application started.');
      autoLoadBrowsers();
      require('electron-debug')({showDevTools: isDev});
    },
    error => {
      logger.error('Failed to initialize database during application start. Error:', error);
    }
  );

  buildTray();
  createMainWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', appReady);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function openUrl (rule, url) {
  let aORb = '-b';
  let options = [];
  let application = rule.application.identifier;

  if (rule.use_app_executable) {
    aORb = '-a';
    application = rule.application.executable;
  }
  if (rule.open_new_instance) {
    options.push('-n');
  }
  if (rule.open_not_foreground) {
    options.push('-g');
  }
  if (rule.open_fresh) {
    options.push('-F');
  }
  open2(url, application, aORb, options.join(' '), rule.open_args);
}

function openUrlInDefaultBrowser (url) {
  sqlodm.application.findOne({is_default: true}).then(
    application => {
      open2(url, application.identifier, '-b');
    },
    error => {
      logger.error('[open-url] Failed to get default browser to use. Error: ', error);
      createSecondaryWindow(url);
    }
  );
}

app.on('open-file', (event, f) => {
  event.preventDefault();
  sqlodm.application.findOne({is_default: true}).then(
    application => {
      open2(f, application.identifier, '-b');
    },
    error => {
      logger.error('Failed to open file. Error: ', error);
      createSecondaryWindow(f);
    }
  );
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  sqlodm.prefs.find().then(
    results => {
      let appStatus = results.find(item => { return item.name === CONST.STATUS.IS_APP_ENABLED });
      let useDefault = results.find(item => { return item.name === CONST.STATUS.IS_USE_DEFAULT });
      if (appStatus.status) {
        sqlodm.rule.find({is_active: true}, {populate: true}).then(
          rules => {
            let rule = evaluators.evaluateRules(rules, url, event);
            if (rule) {
              openUrl(rule, url);
            } else {
              if (useDefault.status) {
                openUrlInDefaultBrowser(url);
              } else {
                createSecondaryWindow(url);
              }
            }
          },
          error => {
            createSecondaryWindow(url);
            logger.error('[open-url] Failed to get the list of rules. Error: ', error);
          }
        )
      } else {
        createSecondaryWindow(url);
      }
    },
    error => {
      logger.error('[open-url] Failed to get configuration. Error: ', error);
      createSecondaryWindow(url);
    }
  )
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Register listeners

// Icons
ipcMain.on(signals.request(signals.ICON.READ), (event, arg) => {
  return sqlodm.icon.find(arg.query, arg.options).then(
    result => {
      event.sender.send(signals.response(signals.ICON.READ), result);
    },
    error => {
      logger.error(`[${signals.ICON.READ}] Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

// Apps/Browsers
ipcMain.on(signals.request(signals.APPLICATION.READ), (event, arg) => {
  sqlodm.application.find(arg.query, arg.options).then(
    result => {
      result.forEach((elem, idx, result) => {
        result[idx] = Object.assign({}, elem.toJSON());
      });
      event.sender.send(signals.response(signals.APPLICATION.READ), result);
    },
    error => {
      logger.error(`[${signals.APPLICATION.READ}] Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.APPLICATION.UPDATE_DEFAULT), (event, arg) => {
  sqlodm.application.findOneAndUpdate({is_default: true}, {is_default: false}, {}).then(
    result => {
      sqlodm.application.findOneAndUpdate(arg.query, {is_default: true}, {}).then(
        res => {
          event.sender.send(signals.response(signals.APPLICATION.UPDATE_DEFAULT), res);
          logger.info(`Changed default browser from "${result.name}" to "${res.name}"`)
        },
        err => {
          logger.error(`[${signals.APPLICATION.UPDATE_DEFAULT}] Failed to change default browser. Error: `, err);
          event.sender.send(signals.response(signals.GENERAL.ERROR), err);
        }
      );
    },
    error => {
      logger.error(`[${signals.APPLICATION.UPDATE_DEFAULT}] Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.APPLICATION.READ_ONE), (event, arg) => {
  sqlodm.application.findOne(arg.query, arg.options).then(
    result => {
      event.sender.send(signals.response(signals.APPLICATION.READ_ONE), result);
    },
    error => {
      logger.error(`[${signals.APPLICATION.READ_ONE}] Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.APPLICATION.DELETE_ONE), (event, arg) => {
  sqlodm.application.deleteOne(arg.query).then(
    () => {
      Promise.all([
        sqlodm.icon.deleteMany({application: arg.query._id}),
        sqlodm.rule.deleteMany({application: arg.query._id})
      ]).then(
        result => {
          event.sender.send(signals.response(signals.APPLICATION.DELETE_ONE), result);
          logger.info(`Removed application: ${arg.query._id}`);
        },
        error => {
          logger.error(`[${signals.APPLICATION.DELETE_ONE}] Failed to remove application ${arg.query._id}. Error: `, error);
          event.sender.send(signals.response(signals.GENERAL.ERROR), error);
        }
      )
    },
    error => {
      logger.error(`[${signals.APPLICATION.DELETE_ONE}] Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.APPLICATION.CREATE_ONE), (event, arg) => {
  sqlodm.application.create(arg.values).save().then(
    result => {
      result = Object.assign({}, result.toJSON());

      iconutil.toIconset(result.icns,
        (err, icons) => {
          if (!err) {
            for (let [k, v] of utils.entries(icons)) {
              sqlodm.icon.create({name: k, application: result._id, content: v}).save().then(
                icon => {
                  logger.info(`Added icon ${icon.name} for application ${result.name}`);
                },
                error => {
                  logger.error(`[${signals.APPLICATION.CREATE_ONE}] Failed to add icon for application. Error: `, error);
                }
              );
            }
            event.sender.send(signals.response(signals.APPLICATION.CREATE_ONE), result);
            logger.info(`Added application: ${result.name}`);
          } else {
            event.sender.send(signals.response(signals.APPLICATION.CREATE_ONE), result);
          }
        }
      );
    },
    error => {
      logger.error(`[${signals.APPLICATION.CREATE_ONE}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  )
});

ipcMain.on(signals.request(signals.APPLICATION.UPDATE_ONE), (event, arg) => {
  let values = sqlodm.application._fromData(arg.values).toJSON();
  sqlodm.application.findOneAndUpdate(arg.query, values).then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.APPLICATION.UPDATE_ONE), result);
      logger.info(`Updated application: ${result.name}`);
    },
    error => {
      logger.error(`[${signals.APPLICATION.UPDATE_ONE}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.APPLICATION.UPDATE), (event, arg) => {
  sqlodm.application.find(arg.query).then(
    result => {
      result.forEach(item => {
        Object.assign(item, arg.values);
        item.save();
      });
      event.sender.send(signals.response(signals.APPLICATION.UPDATE), result);
    },
    error => {
      logger.error(`[${signals.APPLICATION.UPDATE}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

// Settings/Prefs
ipcMain.on(signals.request(signals.CONFIG.READ_STATUS), (event, arg) => {
  sqlodm.prefs.findOne(arg.query).then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.CONFIG.READ_STATUS), result);
    },
    error => {
      logger.error(`[${signals.CONFIG.READ_STATUS}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.CONFIG.UPDATE_STATUS), (event, arg) => {
  sqlodm.prefs.findOneAndUpdate(arg.query, arg.values).then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.CONFIG.UPDATE_STATUS), result);
      logger.info(result.status ? 'Enabled app' : 'Disabled app');
    },
    error => {
      logger.error(`[${signals.CONFIG.UPDATE_STATUS}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.CONFIG.READ_IS_USE_DEFAULT), (event, arg) => {
  sqlodm.prefs.findOne(arg.query).then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.CONFIG.READ_IS_USE_DEFAULT), result);
    },
    error => {
      logger.error(`[${signals.CONFIG.READ_IS_USE_DEFAULT}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.CONFIG.UPDATE_IS_USE_DEFAULT), (event, arg) => {
  sqlodm.prefs.findOneAndUpdate(arg.query, arg.values).then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.CONFIG.UPDATE_IS_USE_DEFAULT), result);
      let action = result.status ? 'Enabled' : 'Disabled';
      logger.info(`${action} usage of default browser if none of the rules match an URL`);
    },
    error => {
      logger.error(`[${signals.CONFIG.UPDATE_IS_USE_DEFAULT}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

// Rules
ipcMain.on(signals.request(signals.RULE.READ), (event, arg) => {
  sqlodm.rule.find(arg.query, arg.options).then(
    result => {
      result.forEach((elem, idx, result) => {
        result[idx] = elem.toJSON();
      });
      event.sender.send(signals.response(signals.RULE.READ), result);
    },
    error => {
      logger.error(`[${signals.RULE.READ}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.RULE.CREATE_ONE), (event, arg) => {
  sqlodm.rule.create(arg.values).preValidate().save().then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.RULE.CREATE_ONE), result);
      logger.info(`Added rule: ${result._id}`);
    },
    error => {
      logger.error(`[${signals.RULE.CREATE_ONE}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.RULE.UPDATE_ONE), (event, arg) => {
  let values = sqlodm.rule.create(arg.values).preValidate().toJSON();
  sqlodm.rule.findOneAndUpdate(arg.query, values, arg.options).then(
    result => {
      result = Object.assign({}, result.toJSON());
      event.sender.send(signals.response(signals.RULE.UPDATE_ONE), result);
      logger.info(`Updated rule: ${result._id}`);
    },
    error => {
      logger.error(`[${signals.RULE.UPDATE_ONE}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.RULE.DELETE_ONE), (event, arg) => {
  sqlodm.rule.deleteOne(arg.query).then(
    result => {
      event.sender.send(signals.response(signals.RULE.DELETE_ONE), result);
      logger.info(`Deleted rule: ${result._id}`);
    },
    error => {
      logger.error(`[${signals.RULE.DELETE_ONE}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.RULE.CLEAR), (event, arg) => {
  sqlodm.rule.clearCollection().then(
    result => {
      event.sender.send(signals.response(signals.RULE.CLEAR), result);
    },
    error => {
      logger.error(`[${signals.RULE.CLEAR}]. Error: `, error);
      event.sender.send(signals.response(signals.GENERAL.ERROR), error);
    }
  );
});

ipcMain.on(signals.request(signals.CONFIG.RESET_ALL), (event, arg) => {
  let userDataPathDatabases = path.join(app.getPath('userData'), 'databases');
  for (let fpath of [
    path.join(userDataPathDatabases, 'applications.db'),
    path.join(userDataPathDatabases, 'icons.db'),
    path.join(userDataPathDatabases, 'rules.db'),
    path.join(userDataPathDatabases, 'settings.db')
  ]) {
    if (fs.existsSync(fpath) && fs.statSync(fpath).isFile()) {
      fs.unlinkSync(fpath);
    }
  }
  app.relaunch();
  app.exit(0);
  event.returnValue = 'done';
});

ipcMain.on(signals.request(signals.GENERAL.TEST_URL), (event, arg) => {
  let result = evaluators.evaluateRules(arg.rules, arg.url, event);
  if (result) {
    result = Object.assign({}, result);
  }
  event.sender.send(signals.response(signals.GENERAL.TEST_URL), result);
});

// App2 signal handlers
ipcMain.on(signals.request(signals.GENERAL.OPEN_URL), (event, arg) => {
  open2(arg.url, arg.application.identifier, '-b');
  secondaryWindow.close();
  // secondaryWindow.destroy();
});
