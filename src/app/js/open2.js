'use strict';

const exec = require('child_process').exec;

function escape (s) {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/"/g, '\\\"');
}

/**
 * open a file or uri using the default application for the file type.
 *
 * @return {ChildProcess} - the child process object.
 * @param {string} target - the file/uri to open.
 * @param {string} app - (optional) the application to be used to open the
 *      file (for example, "chrome", "firefox")
 * @param mode
 * @param options
 * @param args
 *      an error object that contains a property 'code' with the exit
 *      code of the process.
 */
function open2 (target, app, mode, options = null, args = null) {
  app = escape(app);
  target = encodeURI(target);

  let cmd = `open ${mode} "${app}"`;

  if (options) {
    cmd = `${cmd} ${options}`;
  }

  cmd = `${cmd} "${target}"`;

  if (args) {
    cmd = `${cmd} −−args ${args}`;
  }

  return exec(cmd);
}

module.exports = open2;
