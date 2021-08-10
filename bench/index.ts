import Benchmark, { CompareBy } from "../lib";

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
  console.log(benchmark.compareWith(benchmark2, CompareBy.Percent));

  // let benchmark3 = new Benchmark("Intended error", {
  //   fn: () => {
  //     throw new Error("Intended error");
  //   }
  // });

  // await benchmark3.run();

  // console.log(benchmark3.toJSON());

  // let benchmark4 = new Benchmark("Direct function", () => "Hello World!".indexOf("orl"));
  // await benchmark4.run();
  // console.log(benchmark4.toJSON());

  // let suite = new Benchmark.Suite("String comparison", {
  //   beforeEach(benchmark) {
  //     console.log(`${this.name}: ${benchmark.name}: Start`);
  //   },
  //   afterEach(benchmark) {
  //     console.log(`${this.name}: ${benchmark.name}: End`);
  //   }
  // });
  // suite.add("Direct comparison", () => "Hello World!" === "Hello World!");
  // suite.add("Regexp comparison", () => new RegExp("Hello World!").test("Hello World!"));
  // suite.add("IndexOf comparison", () => "Hello World!".indexOf("Hello World!"));
  // suite.add("Complex comparison", () => {
  //   let str = "Hello World!";
  //   let str2 = "Hello World!";
  //   let l = str.length;
  //   str.length === str2.length && str[0] === str2[0] && str[l - 1] === str2[l - 1] && str === str2;
  // });

  // await suite.run();

  // let result = suite.compareFastestWithSlowest(CompareBy.Percent);
  // console.log(result.fastest.name + " is faster than " + result.slowest.name + " by " + result.by + "%");

  // console.log(suite.toJSON());
})();
