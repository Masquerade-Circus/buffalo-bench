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
const { Benchmark } = require('buffalo-bench');

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
const { Benchmark } = require('buffalo-bench');

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
  before: async () => {
    await doSomething();
  },
  after: async () => {
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

### Suite example: 
```js
const { Benchmark } = require('buffalo-bench');

let suite = new Benchmark.Suite("String comparison", {
  beforeEach(benchmark) {
    console.log(`${this.name}: ${benchmark.name}: Start`);
  },
  afterEach(benchmark) {
    console.log(`${this.name}: ${benchmark.name}: End`);
  }
});
suite.add("Direct comparison", () => "Hello World!" === "Hello World!");
suite.add("Regexp comparison", () => new RegExp("Hello World!").test("Hello World!"));
suite.add("IndexOf comparison", () => "Hello World!".indexOf("Hello World!"));
suite.add("Complex comparison", () => {
  let str = "Hello World!";
  let str2 = "Hello World!";
  let l = str.length;
  str.length === str2.length && str[0] === str2[0] && str[l - 1] === str2[l - 1] && str === str2;
});

await suite.run();

// String comparison: Direct comparison: Start
// String comparison: Direct comparison: End
// String comparison: Regexp comparison: Start
// String comparison: Regexp comparison: End
// String comparison: IndexOf comparison: Start
// String comparison: IndexOf comparison: End
// String comparison: Complex comparison: Start
// String comparison: Complex comparison: End

let result = suite.compareFastestWithSlowest('percent');
console.log(result.fastest.name + " is faster than " + result.slowest.name + " by " + result.by + "%"); 
// Direct comparison is faster than Regexp comparison by 281.47%
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
* `before`: A function to be run once before the benchmark loop starts, does not count for run time.
* `after`: A function to be run once after the benchmark loop finishes, does not count for run time.
* `onError`: A function to be run if an error occurs.
* `fn`: The function to be run.

The `Benchmark` instance has the following properties:
* `name`: The name of the benchmark.
* `error`: The error object if an error occurred.
* `cycles`: The number of cycles performed.
* `samples`: The number of samples taken.
* `hz`: The number of cycles per second.
* `meanTime`: The meanTime time per cycle.
* `medianTime`: The medianTime time per cycle.
* `standardDeviation`: The standard deviation.
* `maxTime`: The maximum time.
* `minTime`: The minimum time.
* `times`: An array of times for each cycle.
* `options`: The options object passed to the constructor.
* `stamp`: A timestamp representing when the benchmark was created.
* `runTime`: The total time taken to run the benchmark, this does not include beforeEach, afterEach, before and after hooks.
* `totalTime`: The total time taken to run the benchmark including beforeEach, afterEach, before and after hooks.

The `Benchmark` instance has the following methods:
* `run()`: Async method that runs the benchmark.
* `toJSON()`: Return a JSON representation of the benchmark.
* `compareWith(other: Benchmark, compareBy: CompareBy)`: Compare this benchmark to the other benchmark and return a number representing the difference of the `CompareBy` metric between the two benchmarks.

The `Benchmark` class has the following static properties:
* `version`: A string containing the library version.
* `defaults`: An object containing the default options.
* `Suite`: A class that represents a suite of benchmarks.

The `Suite` constructor takes a `name` and an `options` object argument with the following properties:
* `maxTime`: The maximum time in seconds that a benchmark can take including hooks.
* `minSamples`: The minimum number of samples that must be taken.
* `beforeEach`: A function to be run once before each benchmark run, does not count for run time.
* `afterEach`: A function to be run once after each benchmark run, does not count for run time.
* `before`: A function to be run once before the benchmark run starts, does not count for run time.
* `after`: A function to be run once after the benchmark run finishes, does not count for run time.
* `onError`: A function to be run if an error occurs.

The `Suite` instance has the following properties:
* `name`: The name of the suite.
* `error`: The error object if an error occurred.
* `options`: The options object passed to the constructor.
* `stamp`: A timestamp representing when the suite was created.
* `runTime`: The total time taken to run the suite, this does not include beforeEach, afterEach, before and after hooks.
* `totalTime`: The total time taken to run the suite including beforeEach, afterEach, before and after hooks.
* `benchmarks`: An array of the benchmarks in the suite.

The `Suite` instance has the following methods:
* `add(name: string, optionsOrFn: BenchmarkOptions | Function, options?: BenchmarkOptions)`: Add a benchmark to the suite.
* `getSortedBenchmarksBy(sortedBy: CompareBy)`: Get the benchmarks sorted by a given `CompareBy` metric.
* `getFastest(sortedBy: CompareBy)`: Get the fastest benchmark in the suite sorting by the given `CompareBy` metric.
* `getSlowest(sortedBy: CompareBy)`: Get the slowest benchmark in the suite sorting by the given `CompareBy` metric.
* `compareFastestWithSlowest(compareBy: CompareBy)`: Compare the fastest benchmark with the slowest benchmark sorting by the given `CompareBy` metric.
* `run`: Async method that runs the suite.
* `toJSON`: Return a JSON representation of the suite.

The `CompareBy` enum has the following values:
* `meanTime`: Compare by the mean time per cycle.
* `medianTime`: Compare by the median time per cycle.
* `standardDeviation`: Compare by the standard deviation.
* `maxTime`: Compare by the maximum time.
* `minTime`: Compare by the minimum time.
* `hz`: Compare by the number of cycles per second.
* `runTime`: Compare by the total time taken to run the suite.
* `cycles`: Compare by the number of cycles.
* `percent`: Compare by the percentage of cycles that were slower than the fastest benchmark.

### Api Notes

If the `beforeEach` `afterEach` `before` `after` `onError` returns a Promise, the benchmark will wait for the promise to resolve before continuing.

If the `beforeEach` function throws an error, the benchmark will stop and emit an `BeforeEachError` event.  
If the `afterEach` function throws an error, the benchmark will stop and emit an `AfterEachError` event.  
If the `fn` function throws an error, the benchmark will stop and emit an `RunError` event.  
If the `after` function throws an error, the benchmark will stop and emit an `AfterError` event.  
If the `before` function throws an error, the benchmark will stop and emit an `BeforeError` event.  
If the `onError` function throws an error, the benchmark will stop and emit an `FatalError` event.  

This errors will be found in the `error` property of the benchmark instance.
When converting to JSON, the `errorMessage` property will be a string containing the error message.

## Using typescript 

If you want to write your benchmarks with typescript, you must install the `ts-node` library and require in your project the `ts-node/register` file.

Example: 

```js
require('ts-node/register');
require('./my-benchmark.ts');
```

```ts
import { Benchmark } from 'buffalo-bench/lib';

const bench = new Benchmark('myBenchmark', () => {});
(async () => {
  await bench.run();
  console.log(bench.toJSON());
})();
```

## Development and Build

-   Use `yarn dev` to watch and compile the library on every change to it running the index.ts benchmark in the tests folder.
-   Use `yarn build` to build the library. 
-   Use `yarn commit` to commit your changes.

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