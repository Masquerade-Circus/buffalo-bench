import { Benchmark, CompareBy } from "../dist/index.mjs";

(async () => {
  let suite = new Benchmark.Suite("String comparison", {
    beforeEach(benchmark) {
      console.log(`${this.name}: ${benchmark.name}: Start`);
    },
    afterEach(benchmark) {
      console.log(`${this.name}: ${benchmark.name}: End`);
    }
  });
  suite.add("Direct comparison", () => "Hello World!" === "Hello World!");
  suite.add("Regexp comparison", () =>
    new RegExp("Hello World!").test("Hello World!")
  );
  suite.add("IndexOf comparison", () => "Hello World!".indexOf("Hello World!"));
  suite.add("Complex comparison", () => {
    let str = "Hello World!";
    let str2 = "Hello World!";
    let l = str.length;
    str.length === str2.length &&
      str[0] === str2[0] &&
      str[l - 1] === str2[l - 1] &&
      str === str2;
  });

  await suite.run();

  let result = suite.compareFastestWithSlowest(CompareBy.Percent);
  console.log(
    result.fastest.name +
      " is faster than " +
      result.slowest.name +
      " by " +
      result.by +
      "%"
  );
})();
