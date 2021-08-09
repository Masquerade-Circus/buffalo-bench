<div style="text-align: center">

[![npm version](https://img.shields.io/npm/v/buffalo-bench.svg?style=flat)](https://npmjs.org/package/buffalo-bench "View this project on npm")
[![Dependencies](https://img.shields.io/david/masquerade-circus/buffalo-bench.svg)](https://david-dm.org/masquerade-circus/buffalo-bench)
![](https://img.shields.io/github/issues/masquerade-circus/buffalo-bench.svg)
![](https://img.shields.io/snyk/vulnerabilities/npm/buffalo-bench.svg)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/7b001c192f234940a071be42b04c5e37)](https://www.codacy.com/gh/Masquerade-Circus/buffalo-bench/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Masquerade-Circus/buffalo-bench&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/ec6361e8f2d69530c8e4/maintainability)](https://codeclimate.com/github/Masquerade-Circus/buffalo-bench/maintainability)
[![License](https://img.shields.io/github/license/masquerade-circus/valyrian.js.svg)](https://github.com/masquerade-circus/valyrian.js/blob/master/LICENSE)

</div>

## Buffalo-Bench 

A benchmarking library that supports async hooks and benchmarks by default.

## The problem

This library comes from the problem of handling async hooks in a way that is compatible with benchmarking.

The problem is that async hooks are not supported by Benchmark.js. See the foot notes. 

For example, the following code will not work as expected:

```js
  new Benchmark('test', async () => {
    await doSomething();
  }, {
    async: true,
    async onStart() {
      console.log(1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(2);
    }
  })
```

The previous code will log `1` and then run the benchmark, and the log `2` could be logged before the benchmark is finished or couldn't be logged at all.

This problem prevent us to create an async onStart and/or onComplete for a benchmark like an api call that requires opening a db connection, creating a collection, adding a document and launching a server to handle the request. And after the benchmark finishes clear the databese, close the connection and stop the server.

So, BuffaloBench solves this problem by providing a way to create a benchmarks with all the hooks handled as async by default. (Also works with sync functions)

## Examples

### Simple example
```js
const Benchmark = require('buffalo-bench');

// Create a benchmark only with name and function
const bench = new Benchmark("name", async () => {});

// Create a benchmark with name, function and options
const bench = new Benchmark("name", async () => {}, options);

// Create a benchmark with name and options
const bench = new Benchmark("name", {fn: async () => {}, ...options});

// Run the benchmark
await bench.run();
```

### Full example:
```js
// Create a benchmark with all the options
const bench = new Benchmark('myBenchmark', {
  maxTime: 5, // In seconds
  minSamples: 1,
  beforeEach: async () => {
    await doSomething();
  },
  afterEach: async () => {
    await doSomething();
  },
  onComplete: async () => {
    await doSomething();
  },
  onStart: async () => {
    await doSomething();
  },
  onError: async (error) => {
    await doSomething();
  },
  fn: async () => {
    await doSomething();
  }
});

// Run the benchmark
await bench.run();
```

## Installation
You can get this library as a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/):

```bash
// With npm
$ npm install buffalo-bench
// With yarn
$ yarn add buffalo-bench
```

Or you can use it standalone in the browser with:  
`<script src="https://cdn.jsdelivr.net/npm/buffalo-bench"></script>`

## Api

The `Benchmark` constructor takes an `options` object argument with the following properties:
* `maxTime`: The maximum time in seconds that a benchmark can take including hooks.
* `minSamples`: The minimum number of samples that must be taken.
* `beforeEach`: A function to be run once before each benchmark loop, does not count for run time.
* `afterEach`: A function to be run once after each benchmark loop, does not count for run time.
* `onStart`: A function to be run once before the benchmark loop starts, does not count for run time.
* `onComplete`: A function to be run once after the benchmark loop finishes, does not count for run time.
* `onError`: A function to be run if an error occurs.
* `fn`: The function to be run.

The `Benchmark` instance has the following properties:
* `name`: The name of the benchmark.
* `error`: The error object if an error occurred.
* `cycles`: The number of cycles performed.
* `hz`: The number of cycles per second.
* `meanTime`: The meanTime time per cycle.
* `medianTime`: The medianTime time per cycle.
* `standardDeviation`: The standard deviation.
* `maxTime`: The maximum time.
* `minTime`: The minimum time.
* `times`: An array of times for each cycle.
* `options`: The options object passed to the constructor.
* `stamp`: A timestamp representing when the benchmark was created.
* `runTime`: The total time taken to run the benchmark, this does not include beforeEach, afterEach, onStrart and onComplete hooks.
* `totalTime`: The total time taken to run the benchmark including beforeEach, afterEach, onStart and onComplete hooks.

The `Benchmark` instance has the following methods:
* `run`: Async method that runs the benchmark.
* `toJSON`: Return a JSON representation of the benchmark.
* `compare`: Compare this benchmark to another.

The `Benchmark` class has the following static properties:
* `version`: A string containing the library version.
* `defaults`: An object containing the default options.

### Api Notes

If the `beforeEach` `afterEach` `onComplete` `onStart` `onError` returns a Promise, the benchmark will wait for the promise to resolve before continuing.

If the `beforeEach` function throws an error, the benchmark will stop and emit an `beforeEachError` event.  
If the `afterEach` function throws an error, the benchmark will stop and emit an `afterEachError` event.  
If the `fn` function throws an error, the benchmark will stop and emit an `RunError` event.  
If the `onComplete` function throws an error, the benchmark will stop and emit an `CompleteError` event.  
If the `onStart` function throws an error, the benchmark will stop and emit an `StartError` event.  
If the `onError` function throws an error, the benchmark will stop and emit an `FatalError` event.  

This errors will be found in the `error` property of the benchmark instance.
When converting to JSON, the `errorMessage` property will be a string containing the error message.

## Using typescript 

If you want to write your benchmarks with typescript, you can use the library as it is by requiring in your project the `buffalo-bench/register` file.

Example: 

```js
require('buffalo-bench/register');
require('./my-benchmark.ts');)
```

```ts
import Benchmark from 'buffalo-bench';

const bench = new Benchmark('myBenchmark', () => {});
(async () => {
  await bench.run();
  console.log(bench.toJSON());
})();
```

This register file uses the `eslint` and `pirates` modules to transpile the typescript code to javascript on the fly.

Take into account that this will not check the typescript code for errors. If you want to check your typescript code, you can must use the `tsc` package.

## Development and Build

-   Use `yarn dev` to watch and compile the library on every change to it running the benchmarks in the bench folder.
-   Use `yarn build` to build the library. 
-  Use `yarn commit` to commit your changes.

## Contributing

-   Use prettify and eslint to lint your code.
-   Add tests for any new or changed functionality.
-   Update the readme with an example if you add or change any functionality.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)

## Foot notes
- Issue closed since 2013: https://github.com/bestiejs/benchmark.js/issues/36
- Issue closed since 2013: https://github.com/bestiejs/benchmark.js/issues/53
- Issue closed since 2016: https://github.com/bestiejs/benchmark.js/issues/70 (this is the best example I could find)
- PR that tries to fix the issue currently open: https://github.com/bestiejs/benchmark.js/pull/174