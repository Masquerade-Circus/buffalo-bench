// A benchmarking library that supports async hooks and benchmarks by default.
// This library comes by the problem of handling async functions in a way that is compatible with benchmarking.
// The problem is that async hook are not supported by Benchmark.js
// For example, the following code will not work as expected:

/*
  new Benchmark('test', async () => {
    await doSomething();
  }, {
    async: true,
    async before() => {
      console.log(1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(2);
    },
  })
*/

// The previous code will log 1 and then run the benchmark and the log 2 could be logged before the benchmark is finished or could't be logged at all.
// This problem prevent us to create an async before and/or after for a benchmark like an api call that could require it.

// This library solves this problem by providing a way to create a benchmark with all the hooks and benchmark handled as async by default.

// Simple examples
// const bench = new Benchmark("name", async () => {});
// const bench = new Benchmark("name", async () => {}, options);
// const bench = new Benchmark("name", {fn: async () => {}, ...options});
// await bench.run();

// Full example:
// const bench = new Benchmark('myBenchmark', {
//   maxTime: 5, // In seconds
//   minSamples: 1,
//   beforeEach: async () => {
//     await doSomething();
//   },
//   afterEach: async () => {
//     await doSomething();
//   },
//   after: async () => {
//     await doSomething();
//   },
//   before: async () => {
//     await doSomething();
//   },
//   onError: async (error) => {
//     await doSomething();
//   },
//   fn: async () => {
//     await doSomething();
//   },
// });
// await bench.run();

// The `Benchmark` constructor takes an `options` argument.
// The `options` argument is an object with the following properties:
// * `maxTime`: The maximum time in seconds that a benchmark can take including hooks.
// * `minSamples`: The minimum number of samples that must be taken.
// * `beforeEach`: A function to be run once before each benchmark loop, does not count for run time.
// * `afterEach`: A function to be run once after each benchmark loop, does not count for run time.
// * `after`: A function to be run once after the benchmark loop finishes, does not count for run time.
// * `before`: A function to be run once before the benchmark loop starts, does not count for run time.
// * `onError`: A function to be run if an error occurs.
// * `fn`: The function to be run.

// The `Benchmark` instance has the following properties:
// * `name`: The name of the benchmark.
// * `error`: The error object if an error occurred.
// * `cycles`: The number of cycles performed.
// * `hz`: The number of cycles per second.
// * `meanTime`: The meanTime time per cycle.
// * `medianTime`: The medianTime time per cycle.
// * `standardDeviation`: The standard deviation.
// * `maxTime`: The maximum time.
// * `minTime`: The minimum time.
// * `times`: An array of times for each cycle.
// * `options`: The options object passed to the constructor.
// * `stamp`: A timestamp representing when the benchmark was created.
// * `runTime`: The total time taken to run the benchmark, this does not include beforeEach, afterEach, onStrart and after hooks.
// * `totalTime`: The total time taken to run the benchmark including beforeEach, afterEach, before and after hooks.

// The `Benchmark` instance has the following methods:
// * `run`: Run the benchmark.
// * `toJSON`: Return a JSON representation of the benchmark.
// * `compareWith`: Compare this benchmark to another.

// The `Benchmark` class has the following static properties:
// * `version`: A string containing the library version.
// * `defaults`: An object containing the default options.

// If the `beforeEach` `afterEach` `after` `before` `onError` returns a Promise, the benchmark will wait for the promise to resolve before continuing.

// If the `beforeEach` function throws an error, the benchmark will stop and emit an `BeforeEachError` event.
// If the `afterEach` function throws an error, the benchmark will stop and emit an `AfterEachError` event.
// If the `fn` function throws an error, the benchmark will stop and emit an `RunError` event.
// If the `after` function throws an error, the benchmark will stop and emit an `AfterError` event.
// If the `before` function throws an error, the benchmark will stop and emit an `BeforeError` event.
// If the `onError` function throws an error, the benchmark will stop and emit an `FatalError` event.

// This errors will be found in the `error` property of the benchmark instance.
// When converting to JSON, the `errorMessage` property will be a string containing the error message.

import { version } from "../package.json";

let now = typeof performance === "undefined" ? () => Date.now() : () => performance.now();

//*** Errors ***//

// BenchmarkError: An error occurred during benchmarking.
abstract class BenchmarkError extends Error {
  private readonly code?: string;
  readonly message: string;
  readonly name: string;
  statusCode = 0;
  [key: string]: any;

  constructor(message = "Something went wrong", code?: string) {
    super();
    this.message = message;
    this.code = code;
    this.name = (this.constructor as unknown as { name: string }).name;
  }
}

//  BeforeEachError: The `beforeEach` function threw an error.
class BeforeEachError extends BenchmarkError {
  statusCode = 1;
  name = "BeforeEachError";
}

//  AfterEachError: The `afterEach` function threw an error.
class AfterEachError extends BenchmarkError {
  statusCode = 2;
  name = "AfterEachError";
}

//  RunError: The `fn` function threw an error.
class RunError extends BenchmarkError {
  statusCode = 3;
  name = "RunError";
}

//  AfterError: The `after` function threw an error.
class AfterError extends BenchmarkError {
  statusCode = 4;
  name = "AfterError";
}

//  BeforeError: The `before` function threw an error.
class BeforeError extends BenchmarkError {
  statusCode = 5;
  name = "BeforeError";
}

//  FatalError: The `onError` function threw an error.
class FatalError extends BenchmarkError {
  statusCode = 7;
  name = "FatalError";
}

const Errors = {
  BenchmarkError,
  BeforeEachError,
  AfterEachError,
  RunError,
  AfterError,
  BeforeError,
  FatalError
};

type ErrorType = "BeforeEachError" | "AfterEachError" | "RunError" | "AfterError" | "BeforeError" | "FatalError";

// BenchmarkFunction a function that can be used as a benchmark.
type BenchmarkFunction = () => Promise<void | any> | void | any;

//*** Benchmark Options Type ***//
type BenchmarkOptions = {
  // The maximum time in seconds that a benchmark can take.
  maxTime: number;
  // The minimum number of samples that must be taken.
  minSamples: number;
  // A function to be run once before each benchmark loop, does not count for run time.
  beforeEach?: () => Promise<void> | void;
  // A function to be run once after each benchmark loop, does not count for run time.
  afterEach?: () => Promise<void> | void;
  // A function to be run once after the benchmark completes, does not count for run time.
  after?: () => Promise<void> | void;
  // A function to be run once before the benchmark starts, does not count for run time.
  before?: () => Promise<void> | void;
  // A function to be run if an error occurs.
  onError?: (error: BenchmarkError) => Promise<void> | void;
  // The function to be run.
  fn: BenchmarkFunction;
};

interface JsonBenchmark {
  name: string;
  errorMessage?: string;
  cycles: number;
  hz: number;
  meanTime: number;
  medianTime: number;
  standardDeviation: number;
  maxTime: number;
  minTime: number;
  runTime: number;
  totalTime: number;
  samples: number;
}

export const enum CompareBy {
  MeanTime = "meanTime",
  MedianTime = "medianTime",
  StandardDeviation = "standardDeviation",
  MaxTime = "maxTime",
  MinTime = "minTime",
  Hz = "hz",
  RunTime = "runTime",
  Cycles = "cycles",
  Percent = "percent"
}

type BenchmarkConstructor = (
  name: string,
  optionsOrFn: (Partial<BenchmarkOptions> & { fn: BenchmarkFunction }) | BenchmarkFunction,
  options: Partial<BenchmarkOptions>
) => Benchmark;

interface Benchmark {
  Suite: typeof Suite;
  readonly version: string;
  readonly defaults: {
    maxTime: number;
    minSamples: number;
  };
  name: string;
  error?: BenchmarkError;
  cycles: number;
  samples: number;
  hz: number;
  meanTime: number;
  medianTime: number;
  standardDeviation: number;
  maxTime: number;
  minTime: number;
  times: number[];
  options: BenchmarkOptions;
  stamp: number;
  runTime: number;
  totalTime: number;
  constructor: BenchmarkConstructor;
  run(): Promise<void>;
  toJSON(): JsonBenchmark;
  compareWith(other: Benchmark, compareBy: CompareBy): number;
}

// helper to get the correct error type from a normal error
function getError(error: Error, message: string, type: ErrorType): BenchmarkError {
  let benchmarkError = new Errors[type](message);
  benchmarkError.stack = error.stack;
  for (let i in error) {
    if (error.hasOwnProperty(i)) {
      benchmarkError[i] = (error as any)[i];
    }
  }
  return benchmarkError;
}

// helper function to know if a function is async or not
function isAsync(fn: BenchmarkFunction): boolean {
  return fn.constructor.name === "AsyncFunction";
}

async function runCallback(
  instance: any,
  errorTypeIfAny: ErrorType,
  callback?: (...args: any[]) => Promise<void> | void,
  ...args: any[]
): Promise<void | BenchmarkError> {
  if (callback) {
    try {
      await callback.bind(instance)(...args);
    } catch (error: any) {
      return getError(error, `Benchmark \`${instance.name}\` failed to run \`${callback.name}\` callback: ${error.message}`, errorTypeIfAny);
    }
  }
}

// The benchmark class
class Benchmark implements Benchmark {
  static Suite: typeof Suite;
  static readonly version: string = version;
  static readonly defaults: {
    maxTime: number;
    minSamples: number;
  } = {
    maxTime: 5,
    minSamples: 1
  };

  name: string;
  error?: BenchmarkError;
  cycles: number = 0;
  samples: number = 0;
  hz: number = 0;
  meanTime: number = 0;
  medianTime: number = 0;
  standardDeviation: number = 0;
  maxTime: number = 0;
  minTime: number = 0;
  times: number[] = [];
  options: BenchmarkOptions;
  stamp!: number;
  runTime: number = 0;
  totalTime: number = 0;

  constructor(name: string, optionsOrFn: (Partial<BenchmarkOptions> & { fn: BenchmarkFunction }) | BenchmarkFunction, options: Partial<BenchmarkOptions> = {}) {
    this.name = name;
    let opts = {
      ...Benchmark.defaults,
      ...options
    } as BenchmarkOptions;

    if (typeof optionsOrFn === "function") {
      opts.fn = optionsOrFn;
    } else {
      opts = {
        ...opts,
        ...optionsOrFn
      };
    }

    this.options = opts;
  }

  toJSON(): JsonBenchmark {
    const { name, error, cycles, hz, runTime, totalTime, samples, meanTime, medianTime, standardDeviation, maxTime, minTime } = this;

    return {
      name,
      errorMessage: error ? error.message : undefined,
      cycles,
      samples,
      hz,
      meanTime,
      medianTime,
      standardDeviation,
      maxTime,
      minTime,
      runTime,
      totalTime
    };
  }

  compareWith(other: Benchmark, compareBy: CompareBy = CompareBy.Percent): number {
    const { error, cycles, hz, meanTime, medianTime, standardDeviation, maxTime, minTime, runTime } = this;

    if (error) {
      return -1;
    }

    if (other.error) {
      return 1;
    }

    switch (compareBy) {
      case "meanTime":
        return other.meanTime - meanTime;
      case "medianTime":
        return other.medianTime - medianTime;
      case "standardDeviation":
        return standardDeviation - other.standardDeviation;
      case "maxTime":
        return maxTime - other.maxTime;
      case "minTime":
        return other.minTime - minTime;
      case "hz":
        return hz - other.hz;
      case "runTime":
        return runTime - other.runTime;
      case "cycles":
        return cycles - other.cycles;
      case "percent":
        return Math.trunc(((100 / meanTime) * other.meanTime - 100) * 100) / 100;
      default:
        throw new Error(`Unknown compare field: ${compareBy}`);
    }
  }

  async runSample() {
    const { beforeEach, afterEach, fn } = this.options;
    let sampleMaxTime = 1000;
    let startTime = now();

    while (now() - startTime < sampleMaxTime) {
      const startCycleTime = now();
      this.cycles++;
      const BeforeEachError = await runCallback(this, "BeforeEachError", beforeEach);
      if (BeforeEachError) {
        throw BeforeEachError;
      }

      let time;
      try {
        if (isAsync(fn)) {
          let start = now();
          await fn();
          time = now() - start;
        } else {
          let start = now();
          fn();
          time = now() - start;
        }
      } catch (error: any) {
        throw getError(error, `Benchmark \`${this.name}\` failed to run \`fn\`: ${error.message}`, "RunError");
      }

      this.times.push(time);
      this.runTime += time;

      const AfterEachError = await runCallback(this, "AfterEachError", afterEach);
      if (AfterEachError) {
        throw AfterEachError;
      }

      this.totalTime += now() - startCycleTime;
    }
  }

  // Run the benchmark.
  async run(): Promise<void> {
    this.stamp = now();
    const { maxTime, minSamples, after, before, onError } = this.options;
    let maxTimeInMilliseconds = maxTime * 1000;

    try {
      const beforeError = await runCallback(this, "BeforeError", before);
      if (beforeError) {
        throw beforeError;
      }

      while (this.samples < minSamples || this.totalTime < maxTimeInMilliseconds) {
        this.samples++;
        await this.runSample();
      }

      // Calculate the hz by second
      this.hz = this.cycles / (this.runTime / 1000);

      // Calculate the mean, median, margin of error, and standard deviation.
      this.meanTime = this.runTime / this.times.length;
      this.medianTime = this.times.sort((a, b) => a - b)[Math.floor(this.times.length / 2)] || 0;
      this.standardDeviation = Math.sqrt(this.times.map((t) => Math.pow(t - this.meanTime, 2)).reduce((a, b) => a + b, 0) / this.times.length);

      // Calculate the max, min, and average times.
      this.maxTime = this.times.reduce((max, time) => Math.max(max, time), 0);
      this.minTime = this.times.reduce((min, time) => Math.min(min, time), Infinity);

      const afterError = await runCallback(this, "AfterError", after);
      if (afterError) {
        throw afterError;
      }
    } catch (error: any) {
      this.error = error;

      const onErrorError = await runCallback(this, "FatalError", onError, error);
      if (onErrorError) {
        throw onErrorError;
      }
    }
  }
}

//*** Class Suite ***//
type SuiteOptions = {
  // The maximum time in seconds that a benchmark can take.
  maxTime: number;
  // The minimum number of samples that must be taken.
  minSamples: number;
  // A function to be run once before each benchmark run
  beforeEach?: (benchmark: Benchmark, i: number) => Promise<void> | void;
  // A function to be run once after each benchmark run
  afterEach?: (benchmark: Benchmark, i: number) => Promise<void> | void;
  // A function to be run once after the suite completes
  after?: () => Promise<void> | void;
  // A function to be run once before the suite starts
  before?: () => Promise<void> | void;
  // A function to be run if an error occurs.
  onError?: (error: BenchmarkError) => Promise<void> | void;
};

interface JsonSuite {
  name: string;
  errorMessage?: string;
  runTime: number;
  totalTime: number;
  passed: boolean;
  benchmarks: JsonBenchmark[];
}

type SuiteConstructor = (name: string, options?: Partial<SuiteOptions>) => Suite;

interface Suite {
  readonly defaults: {
    maxTime: number;
    minSamples: number;
  };

  name: string;
  error?: BenchmarkError;
  options: SuiteOptions;
  stamp: number;
  runTime: number;
  totalTime: number;
  benchmarks: Benchmark[];

  constructor: SuiteConstructor;
  add(name: string, optionsOrFn: (Partial<BenchmarkOptions> & { fn: BenchmarkFunction }) | BenchmarkFunction, options: Partial<BenchmarkOptions>): Benchmark;
  toJSON(): JsonSuite;
  run(): Promise<void>;

  getSortedBenchmarksBy(sortedBy: CompareBy): Benchmark[];
  getFastest(sortedBy: CompareBy): Benchmark;
  getSlowest(sortedBy: CompareBy): Benchmark;
  compareFastestWithSlowest(compareBy: CompareBy): { fastest: Benchmark; slowest: Benchmark; by: number };
}

class Suite implements Suite {
  static readonly defaults = {
    maxTime: 5,
    minSamples: 1
  };

  name: string;
  error?: BenchmarkError;
  options: SuiteOptions;
  stamp!: number;
  runTime: number = 0;
  totalTime: number = 0;
  benchmarks: Benchmark[] = [];

  constructor(name: string, options: Partial<SuiteOptions> = {}) {
    this.name = name;
    this.options = {
      ...Suite.defaults,
      ...options
    };
  }

  toJSON(): JsonSuite {
    const { error, name, runTime, totalTime } = this;

    return {
      name,
      errorMessage: error ? error.message : undefined,
      runTime,
      totalTime,
      passed: !error,
      benchmarks: this.getSortedBenchmarksBy(CompareBy.MeanTime).map((benchmark) => benchmark.toJSON())
    };
  }

  add(
    name: string,
    optionsOrFn: (Partial<BenchmarkOptions> & { fn: BenchmarkFunction }) | BenchmarkFunction,
    options: Partial<BenchmarkOptions> = {}
  ): Benchmark {
    let opts = {
      ...{
        minSamples: this.options.minSamples,
        maxTime: this.options.maxTime
      },
      ...options
    } as BenchmarkOptions;

    if (typeof optionsOrFn === "function") {
      opts.fn = optionsOrFn;
    } else {
      opts = {
        ...opts,
        ...optionsOrFn
      };
    }
    let benchmark = new Benchmark(name, opts);
    this.benchmarks.push(benchmark);
    return benchmark;
  }

  async run(): Promise<void> {
    this.stamp = now();
    const { beforeEach, afterEach, after, before, onError } = this.options;

    try {
      const beforeError = await runCallback(this, "BeforeError", before);
      if (beforeError) {
        throw beforeError;
      }

      for (let i = 0, l = this.benchmarks.length; i < l; i++) {
        let benchmark = this.benchmarks[i];
        const beforeEachError = await runCallback(this, "BeforeEachError", beforeEach, benchmark, i);
        if (beforeEachError) {
          throw beforeEachError;
        }

        await benchmark.run();
        this.runTime += benchmark.runTime;
        this.totalTime += benchmark.totalTime;

        const afterEachError = await runCallback(this, "AfterEachError", afterEach, benchmark, i);
        if (afterEachError) {
          throw afterEachError;
        }
      }

      const afterError = await runCallback(this, "AfterError", after);
      if (afterError) {
        throw afterError;
      }
    } catch (error: any) {
      this.error = error;

      const onErrorError = await runCallback(this, "FatalError", onError, error);
      if (onErrorError) {
        throw onErrorError;
      }
    }
  }

  getSortedBenchmarksBy(sortBy: CompareBy): Benchmark[] {
    const benchmarks = this.benchmarks.slice();
    const sortedBenchmarks = benchmarks.sort((a, b) => {
      let result = b.compareWith(a, sortBy);
      return result > 0 ? 1 : result < 0 ? -1 : 0;
    });

    return sortedBenchmarks;
  }

  getFastest(sortBy: CompareBy): Benchmark {
    const sortedBenchmarks = this.getSortedBenchmarksBy(sortBy);
    return sortedBenchmarks[0];
  }

  getSlowest(sortBy: CompareBy): Benchmark {
    const sortedBenchmarks = this.getSortedBenchmarksBy(sortBy);
    return sortedBenchmarks[sortedBenchmarks.length - 1];
  }

  compareFastestWithSlowest(compareBy: CompareBy) {
    let sortBy = compareBy === CompareBy.Percent ? CompareBy.MeanTime : compareBy;
    const fastest = this.getFastest(sortBy);
    const slowest = this.getSlowest(sortBy);

    return {
      fastest,
      slowest,
      by: fastest.compareWith(slowest, compareBy)
    };
  }
}

Benchmark.Suite = Suite;

// Export the Benchmark class.
export default Benchmark;
