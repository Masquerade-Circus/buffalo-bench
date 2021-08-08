declare abstract class BenchmarkError extends Error {
    private readonly code?;
    readonly message: string;
    readonly name: string;
    statusCode: number;
    constructor(message?: string, code?: string);
}
declare type BenchmarkFunction = () => Promise<void | any> | void | any;
declare type BenchmarkOptions = {
    maxTime: number;
    minSamples: number;
    setup?: () => Promise<void> | void;
    teardown?: () => Promise<void> | void;
    onComplete?: () => Promise<void> | void;
    onStart?: () => Promise<void> | void;
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
declare type CompareBy = "meanTime" | "medianTime" | "standardDeviation" | "maxTime" | "minTime" | "hz" | "runTime" | "cycles" | "percent";
declare type BenchmarkConstructor = (name: string, optionsOrFn: (Partial<BenchmarkOptions> & {
    fn: BenchmarkFunction;
}) | BenchmarkFunction, options: Partial<BenchmarkOptions>) => Benchmark;
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
declare class Benchmark implements Benchmark {
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
    private runCallback;
    runSample(functionToBenchCleaned: Function): Promise<void>;
}
export default Benchmark;
