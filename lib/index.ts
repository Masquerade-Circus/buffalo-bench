// Create a benchmark runner like Benchmark.js but with a different API.
// When creating a benchmark, pass a name and the code to run.
// The code will be wrapped in a function and executed async with `Benchmark.run` in a fresh JavaScript context.
// This meanTimes that any variables or functions you create will not be shared between your code and the library code.
// You can optionally pass a second argument to `run` to specify options.
// The options are the same as those for `Benchmark.options`.

// Simple examples
// const bench = new Benchmark("name", async () => {});
// const bench = new Benchmark("name", async () => {}, options);
// const bench = new Benchmark("name", {fn: async () => {}, ...options});
// await bench.run();

// Complex example:
// const bench = new Benchmark('myBenchmark', {
//   maxTime: 5,
//   minSamples: 1,
//   setup: async () => {
//     await doSomething();
//   },
//   teardown: async () => {
//     await doSomething();
//   },
//   onComplete: async () => {
//     await doSomething();
//   },
//   onStart: async () => {
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
// * `setup`: A function to be run once before each benchmark loop, does not count for run time.
// * `teardown`: A function to be run once after each benchmark loop, does not count for run time.
// * `onComplete`: A function to be run once after the benchmark loop finishes, does not count for run time.
// * `onStart`: A function to be run once before the benchmark loop starts, does not count for run time.
// * `onError`: A function to be run if an error occurs.
// * `fn`: The function to be run.

// The `Benchmark` constructor returns an object with the following properties:
// * `name`: The name of the benchmark.
// * `error`: The error object if an error occurred.
// * `cycles`: The number of cycles perforelativeMarginOfErrord.
// * `hz`: The number of cycles per second.
// * `meanTime`: The meanTime time per cycle.
// * `medianTime`: The medianTime time per cycle.
// * `standardDeviation`: The standard deviation.
// * `maxTime`: The maximum time.
// * `minTime`: The minimum time.
// * `times`: An array of times for each cycle.
// * `options`: The options object passed to the constructor.
// * `stamp`: A timestamp representing when the benchmark was created.
// * `runTime`: The total time taken to run the benchmark, this does not include setup, teardown, onStrart and onComplete hooks.
// * `totalTime`: The total time taken to run the benchmark including setup, teardown, onStart and onComplete hooks.

// The `Benchmark` object has the following methods:
// * `run`: Run the benchmark.
// * `toJSON`: Return a JSON representation of the benchmark.
// * `compare`: Compare this benchmark to another.

// The `Benchmark` object has the following static properties:
// * `version`: A string containing the library version.
// * `defaults`: An object containing the default options.

// If the `setup` function returns a promise, the benchmark will wait for the promise to resolve before running
// If the `teardown` function returns a promise, the benchmark will wait for the promise to resolve before starting
// If the `fn` function returns a promise, the benchmark will wait for the promise to resolve before continuing
// If the `onComplete` function returns a promise, the benchmark will wait for the promise to resolve before continuing
// If the `onStart` function returns a promise, the benchmark will wait for the promise to resolve before continuing
// If the `onError` function returns a promise, the benchmark will wait for the promise to resolve before continuing

// If the `setup` function throws an error, the benchmark will stop and emit an `SetupError` event.
// If the `teardown` function throws an error, the benchmark will stop and emit an `TeardownError` event.
// If the `fn` function throws an error, the benchmark will stop and emit an `RunError` event.
// If the `onComplete` function throws an error, the benchmark will stop and emit an `CompleteError` event.
// If the `onStart` function throws an error, the benchmark will stop and emit an `StartError` event.
// If the `onError` function throws an error, the benchmark will stop and emit an `FatalError` event.

import { version } from "../package.json";

declare const performance: any;

//*** Errors ***//

// BenchmarkError: An error occurred during benchmarking.
abstract class BenchmarkError extends Error {
  private readonly code?: string;
  readonly message: string;
  readonly name: string;
  statusCode = 0;

  constructor(message = "Something went wrong", code?: string) {
    super();
    this.message = message;
    this.code = code;
    this.name = (this.constructor as unknown as { name: string }).name;
  }
}

//  SetupError: The `setup` function threw an error.
class SetupError extends BenchmarkError {
  statusCode = 1;
  name = "SetupError";
}

//  TeardownError: The `teardown` function threw an error.
class TeardownError extends BenchmarkError {
  statusCode = 2;
  name = "TeardownError";
}

//  RunError: The `fn` function threw an error.
class RunError extends BenchmarkError {
  statusCode = 3;
  name = "RunError";
}

//  CompleteError: The `onComplete` function threw an error.
class CompleteError extends BenchmarkError {
  statusCode = 4;
  name = "CompleteError";
}

//  StartError: The `onStart` function threw an error.
class StartError extends BenchmarkError {
  statusCode = 5;
  name = "StartError";
}

//  FatalError: The `onError` function threw an error.
class FatalError extends BenchmarkError {
  statusCode = 7;
  name = "FatalError";
}

const Errors = {
  BenchmarkError,
  SetupError,
  TeardownError,
  RunError,
  CompleteError,
  StartError,
  FatalError
};

type ErrorType = "SetupError" | "TeardownError" | "RunError" | "CompleteError" | "StartError" | "FatalError";

// BenchmarkFunction a function that can be used as a benchmark.
type BenchmarkFunction = () => Promise<void | any> | void | any;

//*** Benchmark Options Type ***//
type BenchmarkOptions = {
  // The maximum time in seconds that a benchmark can take.
  maxTime: number;
  // The minimum number of samples that must be taken.
  minSamples: number;
  // A function to be run once before each benchmark loop, does not count for run time.
  setup?: () => Promise<void> | void;
  // A function to be run once after each benchmark loop, does not count for run time.
  teardown?: () => Promise<void> | void;
  // A function to be run once after the benchmark completes, does not count for run time.
  onComplete?: () => Promise<void> | void;
  // A function to be run once before the benchmark starts, does not count for run time.
  onStart?: () => Promise<void> | void;
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

type CompareBy = "meanTime" | "medianTime" | "standardDeviation" | "maxTime" | "minTime" | "hz" | "runTime" | "cycles" | "percent";

type BenchmarkConstructor = (
  name: string,
  optionsOrFn: (Partial<BenchmarkOptions> & { fn: BenchmarkFunction }) | BenchmarkFunction,
  options: Partial<BenchmarkOptions>
) => Benchmark;

interface Benchmark {
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
  compare(other: Benchmark, compare: CompareBy): number;
}

// helper to get the correct error type from a normal error
function getError(error: Error, message: string, type: ErrorType): BenchmarkError {
  let benchmarkError = new Errors[type](message);
  benchmarkError.stack = error.stack;
  return benchmarkError;
}

// AsyncFunction constructor to create an async function that can be used as a benchmark.
let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// Create a new function that can be used as a benchmark from a passed function.
function getFunctionToBench(fn: BenchmarkFunction): Function {
  let body = fn
    .toString()
    .replace(/\n\s*/g, "") // Inline newlines and whitespace
    .replace(/^(async\s)?\(\)\s?=>\s?\{(.*)\}$/g, "$2") // Handles `async () => { ... }` && `() => { ... }`
    .replace(/^(async\s)?\(\)\s?=>\s?\((.*)\)$/g, "$2") // Handles `async () => ( ... )` && `() => ( ... )`
    .replace(/^(async\s)?\(\)\s?=>\s?(.*)$/g, "$2") // Handles `async () => ...` && `() => ...`
    .replace(/^(async\s)?function\s?\w+\(\)\s?\{(.*)\}$/g, "$2") // Handles `async function ... { ... }` && `function ... { ... }`
    .replace(/^(async\s)?fn\s?\(\)\s?\{(.*)\}$/g, "$2") // Handles `async fn() { ... }` && `fn() { ... }`
    .replace(/;$/g, ""); // Replace the last ; to prevent double ;; we will add it later

  let code = `const __start__ = performance.now();

${body};
  
return performance.now() - __start__;`;
  return fn.constructor.name === "AsyncFunction" ? new AsyncFunction(code) : new Function(code);
}

// The benchmark class
class Benchmark implements Benchmark {
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
  stamp: number;
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
    this.stamp = performance.now();
  }

  private async runCallback(errorTypeIfAny: ErrorType, callback?: (...args: any[]) => Promise<void> | void, ...args: any[]): Promise<void | BenchmarkError> {
    if (callback) {
      try {
        await callback.bind(this)(...args);
      } catch (error) {
        return getError(error, `Benchmark \`${this.name}\` failed to run \`${callback.name}\` callback: ${error.message}`, errorTypeIfAny);
      }
    }
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

  compare(other: Benchmark, compare: CompareBy = "percent"): number {
    const { error, cycles, hz, meanTime, medianTime, standardDeviation, maxTime, minTime, runTime } = this;

    if (error) {
      return -1;
    }

    if (other.error) {
      return 1;
    }

    switch (compare) {
      case "meanTime":
        return meanTime - other.meanTime;
      case "medianTime":
        return medianTime - other.medianTime;
      case "standardDeviation":
        return standardDeviation - other.standardDeviation;
      case "maxTime":
        return maxTime - other.maxTime;
      case "minTime":
        return minTime - other.minTime;
      case "hz":
        return hz - other.hz;
      case "runTime":
        return runTime - other.runTime;
      case "cycles":
        return cycles - other.cycles;
      case "percent":
        return Math.trunc((100 / other.hz) * hz - 100);
      default:
        throw new Error(`Unknown compare field: ${compare}`);
    }
  }

  async runSample(functionToBenchCleaned: Function) {
    const { setup, teardown } = this.options;
    let sampleMaxTime = 1000;
    let startTime = performance.now();

    while (performance.now() - startTime < sampleMaxTime) {
      const startCycleTime = performance.now();
      this.cycles++;
      const setupError = await this.runCallback("SetupError", setup);
      if (setupError) {
        throw setupError;
      }

      let time;
      try {
        time = await functionToBenchCleaned();
      } catch (error) {
        throw getError(error, `Benchmark \`${this.name}\` failed to run \`fn\`: ${error.message}`, "RunError");
      }

      this.times.push(time);
      this.runTime += time;

      const teardownError = await this.runCallback("TeardownError", teardown);
      if (teardownError) {
        throw teardownError;
      }

      this.totalTime += performance.now() - startCycleTime;
    }
  }

  // Run the benchmark.
  async run(): Promise<void> {
    this.stamp = performance.now();
    const { maxTime, minSamples, onComplete, onStart, onError, fn } = this.options;
    let maxTimeInMilliseconds = maxTime * 1000;

    let functionToBenchCleaned = getFunctionToBench(fn);

    try {
      const onStartError = await this.runCallback("StartError", onStart);
      if (onStartError) {
        throw onStartError;
      }

      while (this.samples < minSamples || this.totalTime < maxTimeInMilliseconds) {
        this.samples++;
        await this.runSample(functionToBenchCleaned);
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

      const onCompleteError = await this.runCallback("CompleteError", onComplete);
      if (onCompleteError) {
        throw onCompleteError;
      }
    } catch (error) {
      this.error = error;

      const onErrorError = await this.runCallback("FatalError", onError);
      if (onErrorError) {
        throw onErrorError;
      }
    }
  }
}

// Export the Benchmark class.
export default Benchmark;
