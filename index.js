/*
 *  WOLT - minimalistic tasks assistant
 *
 *  Copyright 2017-present by nick133 <nick133@gmail.com>
 */

/** @ignore */
const chalk = require('chalk'),
      fs    = require('fs'),
      glob  = require('glob');


/** Container for tasks and dependency tracking
 *  @private
 */
const tasks = {
  __done__: [], // done tasks
};

/** Exported methods/vars */
const task = {};

task.argv = require('yargs')
  .alias({
    't': ['task', 'tasks'],
    'q': ['s', 'quiet', 'silent'],
    'd': ['g', 'v', 'debug', 'verbose'],
    'h': ['help'],
  })
  .usage('Usage: $0 [options]')
  .help('h')
  .describe('t', 'Run task(s)')
  .describe('d', 'Verbose output')
  .describe('q', 'Silent mode')
  .epilog('copyright 2017-present')
  .boolean(['d', 'q'])
  .argv;


/** Generate nice colored time
 *  @return {string} Formatted time [12:34:56]
 *  @private
 */
const niceTime = function() {
  let date = new Date();

  let hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  let min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  let sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  return '[' + chalk.grey(hour + ':' + min + ':' + sec) + ']';
}


/** Logs anonymous messages
 *  @param {...string} mesg - Messages
 *  @example
 *  task.msg('Message', 'from', 'nowhere');
 */
task.msg = function(...mesg) {
  if (task.argv.quiet) return;

  console.log([niceTime()].concat(mesg).join(' '));
};


/** Logs messages from task
 *  @param {string} from - Task badge
 *  @param {...string} mesg - Messages
 *  @example
 *  task.log('build', 'Build started');
 */
task.log = function(from, ...mesg) {
  task.msg(mesg.join(' '), '[' + chalk.cyan(from) + ']');
};


/** Logs error messages
 *  @param {string} from - Task badge
 *  @param {...string} mesg - Error messages
 */
task.error = function(from, ...mesg) {
  task.argv.quiet = false;
  task.log(from, chalk.red.bold('ERROR:'), mesg.join(' '));
}


/** Logs warning messages
 *  @param {string} from - Task badge
 *  @param {...string} mesg - Warnings
 */
task.warn = function(from, ...mesg) {
  task.argv.quiet = false;
  task.log(from, chalk.yellow.bold('WARNING:'), mesg.join(' '));
}


/** Defines task
 *  @param {string} id - Task name
 *  @param {function} batch - function associated with a task. If it's string - works like alias too
 */
task.is = function(id, batch) { tasks[id] = batch };


/** Executes task
 *  @param {string} id - Task name
 *  @param {Object} [params] - Task params
 *  @param {boolean} [force] - Force execution, no registering, no checks
 */
task.do = function(id, params = {}, force = false) {
  if (typeof(tasks[id]) === 'string') return task.do(tasks[id], params, force); // Alias

  if (!force && !task.reg(id)) return; // Already done? Register or quit

  if (typeof(tasks[id]) !== 'function')
    throw 'Invalid or undefined task: ' + id;

  task.log(id, 'Begin');
  let ret = tasks[id](params);
  task.log(id, 'End');

  return ret;
}

/** Shortcut for forced task execution, see {@link do} */
task.force = function(id, params = {}) {
  return task.do(id, params, true);
};


/** Checks task status, is it done?
 *  @param {string} id - Task name
 *  @return {boolean} *true* if done, *false* if undone
 */
task.done = function(id) { return tasks.__done__.indexOf(id) > -1 };


/** Registers task as done
 *  @param {string} id - Task name
 *  @return {boolean} *true* if success, *false* if task is already done
 */
task.reg = function(id) {
  if (task.done(id)) return false;

  tasks.__done__.push(id);
  return true;
}


/** Clears done status for a task
 *  @param {string} id - Task name
 *  @return {boolean} *true* if success, *false* if task is not done yet
 */
task.undo = function(id) {
  if (!task.done(id)) return false;

  tasks.__done__[tasks.__done__.indexOf(id)] = undefined;
  return true;
}


/** Registers alias(es) for a task
 *  @param {string} id - Task name
 *  @param {...string} aliases - Task alias(es)
 *  @example
 *  task.alias('default', 'build', 'main');
 */
task.alias = function(id, ...aliases) {
  aliases.forEach(alias => task.is(id, alias));
}


/** Checks sources vs destinations last modification times
 *  @param {string[]} src - Sources globs to check. Can be single string
 *  @param {string[]} dest - Resulting build files to check. Can be single string
 *  @param {Object} [options] - Options for *glob.sync()* when matching sources
 *  @return {boolean} *true* if rebuild is needed, *false* if all files are up to date
 *  @example
 *  if (!task.check('src/*.js', 'build/static/main.js') return;
 */
task.check = function(src, dest, options = {}) {
  let lastSrcDate  = 0,
      lastDestDate = 0;

  let getLastTime = (files, mode) => {
    let last = 0;

    files.forEach(file => {
      if (mode && !fs.existsSync(file)) return true; // Needs rebuild (dest mode)

      let ctime = fs.statSync(file).ctime.getTime();

      if (ctime > last) last = ctime;
    });

    return last;
  };

  lastDestDate = getLastTime(typeof(dest) === 'string' ? [dest] : dest, true);

  let srcs = [];

  if (typeof(src) === 'string')
    srcs = glob.sync(src, options);
  else if (typeof(src) === 'object' && Array.isArray(src))
    src.forEach(pattern => srcs = srcs.concat(glob.sync(pattern, options)));

  lastSrcDate = getLastTime(srcs);

  return lastSrcDate > lastDestDate;
};


/** Process tasks execution and command line options */
task.cli = function() {
  if (task.argv.task === undefined)
    task.do('default');
  else
    task.argv.task.split(',').forEach(task.do);
};


module.exports = task;
