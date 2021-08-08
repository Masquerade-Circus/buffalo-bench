import Benchmark from "../lib";

(async () => {
  let benchmark = new Benchmark("Regexp test", {
    fn: () => {
      /orl/.test("Hello World!");
    }
  });

  let benchmark2 = new Benchmark("indexOf test", {
    fn: () => {
      "Hello World!".indexOf("orl");
    }
  });

  await benchmark.run();
  await benchmark2.run();

  console.log(benchmark.toJSON());
  console.log(benchmark2.toJSON());
  console.log(benchmark.compare(benchmark2));

  let benchmark3 = new Benchmark("Intended error", {
    fn: () => {
      throw new Error("Intended error");
    }
  });

  await benchmark3.run();

  console.log(benchmark3.toJSON());

  let benchmark4 = new Benchmark("Direct function", () => "Hello World!".indexOf("orl"));
  await benchmark4.run();
  console.log(benchmark4.toJSON());
})();
