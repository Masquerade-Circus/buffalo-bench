const { addHook } = require('pirates');
const { transformSync } = require('esbuild');
const fs = require('fs');

addHook(
  (code, filePath) => {
    let fileName = filePath.split('/').pop();
    let extension = fileName.split('.').pop();

    let loader = 'default';
    if (['js', 'jsx', 'ts', 'tsx', 'css', 'json', 'txt'].includes(extension)) {
      if (['js', 'jsx', 'mjs'].includes(extension)) {
        loader = 'jsx';
      } else if (['ts', 'tsx'].includes(extension)) {
        loader = 'tsx';
      } else if (extension === 'txt') {
        loader = 'text';
      } else {
        loader = extension;
      }
    } else if (['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      loader = 'dataurl';
    }

    let options = {
      tsconfigRaw: {
        compilerOptions: {
          target: 'ESNEXT',
          module: 'ESNEXT',
          strict: true,
          allowSyntheticDefaultImports: true,
          allowJs: true,
          esModuleInterop: true,
          resolveJsonModule: true
        }
      },
      loader,
      minify: false,
      format: 'cjs',
      target: 'esnext',
      logLevel: 'warning'
    };

    // Check if tsconfig.json exists with fs module
    if ((extension === 'ts' || extension === 'tsx') && fs.existsSync(process.cwd() + '/tsconfig.json')) {
      let tsconfig = fs.readFileSync(process.cwd() + '/tsconfig.json', 'utf8');

      let tsconfigRaw = JSON.parse(tsconfig);
      let compilerOptions = tsconfigRaw.compilerOptions || {};

      options.tsconfigRaw = { ...options.tsconfigRaw, ...tsconfigRaw };
      options.tsconfigRaw.compilerOptions = { ...options.tsconfigRaw.compilerOptions, ...compilerOptions };

      if (compilerOptions.target) {
        options.target = compilerOptions.target.toLowerCase();
      }

      if (compilerOptions.module) {
        let format = compilerOptions.module.toLowerCase();
        if (format === 'commonjs') {
          options.format = 'cjs';
        } else if (format.startsWith('es')) {
          options.format = 'esm';
        }
      }
    }

    let { code: transformed } = transformSync(code, options);
    if (/"use strict"\;/gi.test(code) === false) {
      transformed = '"use strict";' + transformed;
    }

    return transformed;
  },
  {
    exts: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.css', '.json', '.text', '.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg', '.html'],
    ignoreNodeModules: false,
    matcher(fileName) {
      return !/node_modules/.test(fileName) || /\.tsx?$/.test(fileName);
    }
  }
);
