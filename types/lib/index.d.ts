declare abstract class BenchmarkError extends Error {
    private readonly code?;
    readonly message: string;
    readonly name: string;
    statusCode: number;
    [key: string]: any;
    constructor(message?: string, code?: string);
}
declare type BenchmarkFunction = () => Promise<void | any> | void | any;
declare type BenchmarkOptions = {
    maxTime: number;
    minSamples: number;
    beforeEach?: () => Promise<void> | void;
    afterEach?: () => Promise<void> | void;
    after?: () => Promise<void> | void;
    before?: () => Promise<void> | void;
    onError?: (error: BenchmarkError) => Promise<void> | void;
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
export declare const enum CompareBy {
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
declare type BenchmarkConstructor = (name: string, optionsOrFn: (Partial<BenchmarkOptions> & {
    fn: BenchmarkFunction;
}) | BenchmarkFunction, options: Partial<BenchmarkOptions>) => Benchmark;
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
declare class Benchmark implements Benchmark {
    static Suite: typeof Suite;
    static readonly version: string;
    static readonly defaults: {
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
    constructor(name: string, optionsOrFn: (Partial<BenchmarkOptions> & {
        fn: BenchmarkFunction;
    }) | BenchmarkFunction, options?: Partial<BenchmarkOptions>);
    runSample(): Promise<void>;
}
declare type SuiteOptions = {
    maxTime: number;
    minSamples: number;
    beforeEach?: (benchmark: Benchmark, i: number) => Promise<void> | void;
    afterEach?: (benchmark: Benchmark, i: number) => Promise<void> | void;
    after?: () => Promise<void> | void;
    before?: () => Promise<void> | void;
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
declare type SuiteConstructor = (name: string, options?: Partial<SuiteOptions>) => Suite;
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
    add(name: string, optionsOrFn: (Partial<BenchmarkOptions> & {
        fn: BenchmarkFunction;
    }) | BenchmarkFunction, options: Partial<BenchmarkOptions>): Benchmark;
    toJSON(): JsonSuite;
    run(): Promise<void>;
    getSortedBenchmarksBy(sortedBy: CompareBy): Benchmark[];
    getFastest(sortedBy: CompareBy): Benchmark;
    getSlowest(sortedBy: CompareBy): Benchmark;
    compareFastestWithSlowest(compareBy: CompareBy): {
        fastest: Benchmark;
        slowest: Benchmark;
        by: number;
    };
}
declare class Suite implements Suite {
    static readonly defaults: {
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
    constructor(name: string, options?: Partial<SuiteOptions>);
}
export default Benchmark;
