
# ~WOLT~ minimalists tasks assistant

To assist you with a simple build tasks.
For the case when [webpack](https://webpack.js.org/) mostly do the job and [gulp](http://gulpjs.com/) is an overkill.


## Features

 - synchronous, no hassle with tasks order
 - dependency tracking
 - incremental build support

## Design concepts

 - no plugins. If you need some module - use it, no special behaviour
 - task is a function, dependency is a function. No cryptic syntax, no hints, no tricks - run them when you need in exact order
 - run your single script for all tasks, having full control of its flow, no additional tool/config


## Background

When I started using [webpack](https://webpack.js.org/) I realised there's no need for [gulp](http://gulpjs.com/) anymore.
Gulp is great, but when it comes to simple tasks and predictable order it's a mess
(please read this: [recipe](https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md),
[issue](https://github.com/gulpjs/gulp/issues/1091),
[post](https://medium.com/@dave_lunny/task-dependencies-in-gulp-b885c1ab48f0#.eswk76foc)).
Finally I've got back to custom build scripts, but hey, one script per task is a bad idea, I need all-in-one simple
config with no additional fancy CLI tool. That's how it was born.


## API

Please read pretty generated API docs [here](https://nick133.github.io/docs/wolt/identifiers.html) or
just look at the source, it's full of comments and almost no code


## Examples

Please look at the live example in *examples/tasks.js*

Create *build.js*:

```javascript
const task = require('wolt');

task.is('default', 'build');

task.alias('build', 'buildme', 'make', 'bake');

task.is('build:dev', () => {
    task.do('dependent');
    task.do('more-dependent', {param: 'some-param'});

    task.force('always-do-this');

    if (!task.check(src, dest)) {
        task.log('build:dev', 'Everything is up to date!');
        return;
    }

    webpackDevServer();
    
    openBrowser();
});

task.cli();
```

Now run it as: *node build.js --task clean,build --quiet*


## FAQ

### Why didn't you just use GNU *make* if you don't need async tasks?

 - I thought of it. Seriously. But *make*'s syntax lacks a full power of Javascript, you know.

### Why didn't you just continue using *gulp*?

 - As I said, I don't like just-another-one fancy CLI for this and that. Especially when *webpack* do it all (almost).

### Why do I need this? Its source almost has no code, just comments..

 - Actually, you don't..

### What it means, WOLT?

 - It's reversed acronym for **T**ask **L**ist **O**f **W**hatever,
or **T**ask **L**ist **O**r **W**hat?
**T**ask **L**ist **O**rder **W**ise is also a good variant.


## Bugs

Please fix them and report if you found some =)

