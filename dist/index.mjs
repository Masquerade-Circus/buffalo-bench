import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// lib/index.ts
var version = "1.0.3";
var now = typeof performance === "undefined" ? () => Date.now() : () => performance.now();
var BenchmarkError = class extends Error {
  code;
  message;
  name;
  statusCode = 0;
  constructor(message = "Something went wrong", code) {
    super();
    this.message = message;
    this.code = code;
    this.name = this.constructor.name;
  }
};
var BeforeEachError = class extends BenchmarkError {
  statusCode = 1;
  name = "BeforeEachError";
};
var AfterEachError = class extends BenchmarkError {
  statusCode = 2;
  name = "AfterEachError";
};
var RunError = class extends BenchmarkError {
  statusCode = 3;
  name = "RunError";
};
var AfterError = class extends BenchmarkError {
  statusCode = 4;
  name = "AfterError";
};
var BeforeError = class extends BenchmarkError {
  statusCode = 5;
  name = "BeforeError";
};
var FatalError = class extends BenchmarkError {
  statusCode = 7;
  name = "FatalError";
};
var Errors = {
  BenchmarkError,
  BeforeEachError,
  AfterEachError,
  RunError,
  AfterError,
  BeforeError,
  FatalError
};
var CompareBy = /* @__PURE__ */ ((CompareBy2) => {
  CompareBy2["MeanTime"] = "meanTime";
  CompareBy2["MedianTime"] = "medianTime";
  CompareBy2["StandardDeviation"] = "standardDeviation";
  CompareBy2["MaxTime"] = "maxTime";
  CompareBy2["MinTime"] = "minTime";
  CompareBy2["Hz"] = "hz";
  CompareBy2["RunTime"] = "runTime";
  CompareBy2["Cycles"] = "cycles";
  CompareBy2["Percent"] = "percent";
  return CompareBy2;
})(CompareBy || {});
function getError(error, message, type) {
  let benchmarkError = new Errors[type](message);
  benchmarkError.stack = error.stack;
  for (let i in error) {
    if (error.hasOwnProperty(i)) {
      benchmarkError[i] = error[i];
    }
  }
  return benchmarkError;
}
function isAsync(fn) {
  return fn.constructor.name === "AsyncFunction";
}
async function runCallback(instance, errorTypeIfAny, callback, ...args) {
  if (callback) {
    try {
      await callback.bind(instance)(...args);
    } catch (error) {
      return getError(error, `Benchmark \`${instance.name}\` failed to run \`${callback.name}\` callback: ${error.message}`, errorTypeIfAny);
    }
  }
}
var _Benchmark = class {
  name;
  error;
  cycles = 0;
  samples = 0;
  hz = 0;
  meanTime = 0;
  medianTime = 0;
  standardDeviation = 0;
  maxTime = 0;
  minTime = 0;
  times = [];
  options;
  stamp;
  runTime = 0;
  totalTime = 0;
  constructor(name, optionsOrFn, options = {}) {
    this.name = name;
    let opts = {
      ..._Benchmark.defaults,
      ...options
    };
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
  toJSON() {
    const {
      name,
      error,
      cycles,
      hz,
      runTime,
      totalTime,
      samples,
      meanTime,
      medianTime,
      standardDeviation,
      maxTime,
      minTime
    } = this;
    return {
      name,
      errorMessage: error ? error.message : void 0,
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
  compareWith(other, compareBy = "percent" /* Percent */) {
    const {
      error,
      cycles,
      hz,
      meanTime,
      medianTime,
      standardDeviation,
      maxTime,
      minTime,
      runTime
    } = this;
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
        return Math.trunc((100 / meanTime * other.meanTime - 100) * 100) / 100;
      default:
        throw new Error(`Unknown compare field: ${compareBy}`);
    }
  }
  async runSample() {
    const { beforeEach, afterEach, fn } = this.options;
    let sampleMaxTime = 1e3;
    let startTime = now();
    while (now() - startTime < sampleMaxTime) {
      const startCycleTime = now();
      this.cycles++;
      const BeforeEachError2 = await runCallback(this, "BeforeEachError", beforeEach);
      if (BeforeEachError2) {
        throw BeforeEachError2;
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
      } catch (error) {
        throw getError(error, `Benchmark \`${this.name}\` failed to run \`fn\`: ${error.message}`, "RunError");
      }
      this.times.push(time);
      this.runTime += time;
      const AfterEachError2 = await runCallback(this, "AfterEachError", afterEach);
      if (AfterEachError2) {
        throw AfterEachError2;
      }
      this.totalTime += now() - startCycleTime;
    }
  }
  async run() {
    this.stamp = now();
    const { maxTime, minSamples, after, before, onError } = this.options;
    let maxTimeInMilliseconds = maxTime * 1e3;
    try {
      const beforeError = await runCallback(this, "BeforeError", before);
      if (beforeError) {
        throw beforeError;
      }
      while (this.samples < minSamples || this.totalTime < maxTimeInMilliseconds) {
        this.samples++;
        await this.runSample();
      }
      this.hz = this.cycles / (this.runTime / 1e3);
      this.meanTime = this.runTime / this.times.length;
      this.medianTime = this.times.sort((a, b) => a - b)[Math.floor(this.times.length / 2)] || 0;
      this.standardDeviation = Math.sqrt(this.times.map((t) => Math.pow(t - this.meanTime, 2)).reduce((a, b) => a + b, 0) / this.times.length);
      this.maxTime = this.times.reduce((max, time) => Math.max(max, time), 0);
      this.minTime = this.times.reduce((min, time) => Math.min(min, time), Infinity);
      const afterError = await runCallback(this, "AfterError", after);
      if (afterError) {
        throw afterError;
      }
    } catch (error) {
      this.error = error;
      const onErrorError = await runCallback(this, "FatalError", onError, error);
      if (onErrorError) {
        throw onErrorError;
      }
    }
  }
};
var Benchmark = _Benchmark;
__publicField(Benchmark, "Suite");
__publicField(Benchmark, "version", version);
__publicField(Benchmark, "defaults", {
  maxTime: 5,
  minSamples: 1
});
var _Suite = class {
  name;
  error;
  options;
  stamp;
  runTime = 0;
  totalTime = 0;
  benchmarks = [];
  constructor(name, options = {}) {
    this.name = name;
    this.options = {
      ..._Suite.defaults,
      ...options
    };
  }
  toJSON() {
    const { error, name, runTime, totalTime } = this;
    return {
      name,
      errorMessage: error ? error.message : void 0,
      runTime,
      totalTime,
      passed: !error,
      benchmarks: this.getSortedBenchmarksBy("meanTime" /* MeanTime */).map((benchmark) => benchmark.toJSON())
    };
  }
  add(name, optionsOrFn, options = {}) {
    let opts = {
      ...{
        minSamples: this.options.minSamples,
        maxTime: this.options.maxTime
      },
      ...options
    };
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
  async run() {
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
    } catch (error) {
      this.error = error;
      const onErrorError = await runCallback(this, "FatalError", onError, error);
      if (onErrorError) {
        throw onErrorError;
      }
    }
  }
  getSortedBenchmarksBy(sortBy) {
    const benchmarks = this.benchmarks.slice();
    const sortedBenchmarks = benchmarks.sort((a, b) => {
      let result = b.compareWith(a, sortBy);
      return result > 0 ? 1 : result < 0 ? -1 : 0;
    });
    return sortedBenchmarks;
  }
  getFastest(sortBy) {
    const sortedBenchmarks = this.getSortedBenchmarksBy(sortBy);
    return sortedBenchmarks[0];
  }
  getSlowest(sortBy) {
    const sortedBenchmarks = this.getSortedBenchmarksBy(sortBy);
    return sortedBenchmarks[sortedBenchmarks.length - 1];
  }
  compareFastestWithSlowest(compareBy) {
    let sortBy = compareBy === "percent" /* Percent */ ? "meanTime" /* MeanTime */ : compareBy;
    const fastest = this.getFastest(sortBy);
    const slowest = this.getSlowest(sortBy);
    return {
      fastest,
      slowest,
      by: fastest.compareWith(slowest, compareBy)
    };
  }
};
var Suite = _Suite;
__publicField(Suite, "defaults", {
  maxTime: 5,
  minSamples: 1
});
Benchmark.Suite = Suite;
export {
  Benchmark,
  CompareBy
};
