const esbuild = require("esbuild");
const terser = require("terser");
const tsc = require("tsc-prog");
const fs = require("fs");

(async () => {
  try {
    let globalName = "Benchmark";
    let result = esbuild.buildSync({
      entryPoints: ["./lib/index.ts"],
      bundle: true,
      sourcemap: "external",
      write: false,
      minify: true,
      outdir: "out",
      target: "esnext",
      loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" },
      format: "esm"
    });

    // HACK: convert to UMD - only supports cjs and global var
    const varName = "__EXPORTS__";
    let code = result.outputFiles[1].text;
    code = code.replace(/export\s*\{([^{}]+)\}/, (_, inner) => {
      const defaultExport = inner.match(/^(\w+) as default$/);
      return defaultExport != null ? `var ${varName}=${defaultExport[1]}` : `var ${varName}={${inner.replace(/(\w+) as (\w+)/g, "$2:$1")}}`;
    });
    code = `(()=>{${code};typeof module!=='undefined'?module.exports=${varName}:self.${globalName}=${varName}})()`;

    let result2 = await terser.minify(code, {
      sourceMap: {
        content: result.outputFiles[0].text.toString()
      },
      compress: {
        booleans_as_integers: false
      },
      output: {
        wrap_func_args: false
      },
      ecma: 2020
    });

    let mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
    let map = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
    fs.writeFileSync("./dist/index.min.js", result2.code);
    fs.writeFileSync("./dist/index.min.js.map", map);

    let tscProgOptions = {
      basePath: process.cwd(), // always required, used for relative paths
      configFilePath: "tsconfig.json", // config to inherit from (optional)
      files: ["./lib/index.ts"],
      pretty: true,
      copyOtherToOutDir: false,
      clean: ["types"],
      compilerOptions: {
        rootDir: "./",
        declaration: true,
        declarationDir: "./types",
        emitDeclarationOnly: true
      }
    };

    tsc.build(tscProgOptions);
  } catch (e) {
    console.error(e);
  }
})();
