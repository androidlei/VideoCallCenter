const typescript = require('rollup-plugin-typescript2');
const tslint = require('rollup-plugin-tslint');
const uglify = require('rollup-plugin-uglify');

const pkg = require('./package.json');

const plugins = (tsConfig = {}) => [
  tslint(),
  typescript({
    tsconfig: 'tsconfig.json',
    tsconfigOverride: tsConfig,
    typescript: require('typescript'),
    cacheRoot: './tmp/.rts2_cache',
    useTsconfigDeclarationDir: true,
    include: [ "src/**/*.ts" ],
  }),
];

const banner = '/*!\n' +
      ` * Video Call Center v${pkg.version} | ${pkg.homepage}\n` +
      ` * (c) ${new Date().getFullYear()} ${pkg.author.name} | Released under the MIT license\n` +
      ' */\n';
export default [
  {
    input: 'src/main.ts',
    plugins: plugins({
      compilerOptions: {
        target: 'ES3',
      },
    }),
    output: {
      file: 'dist/video-call-center.js',
      format: 'cjs',
      banner,
    },
  },
  {
    input: 'src/main.ts',
    plugins: [
      ...plugins({
        compilerOptions: {
          target: 'ES3',
        },
      }),
      uglify()
    ],
    output: {
      file: 'dist/video-call-center.min.js',
      format: 'cjs',
      banner,
    },
  },
  {
    input: 'src/main.ts',
    plugins: plugins({
      compilerOptions: {
        target: 'ES3'
      },
    }),
    output: {
      file: 'dist/video-call-center.umd.js',
      format: 'umd',
      name: 'VideoCallCenter',
      banner,
    },
  },
  {
    input: 'src/main.ts',
    plugins: [
      ...plugins({
        compilerOptions: {
          target: 'ES3',
        },
      }),
      uglify()
    ],
    output: {
      file: 'dist/video-call-center.umd.min.js',
      format: 'umd',
      name: 'VideoCallCenter',
      banner,
    },
  },
  {
    input: 'src/main.ts',
    plugins: plugins({
      compilerOptions: {
        target: 'ES6',
      },
    }),
    output: {
      file: 'dist/video-call-center.m.js',
      format: 'es',
      banner,
    },
  },
  {
    input: 'src/main.ts',
    plugins: [
      ...plugins({
        compilerOptions: {
          target: 'ES6',
          declaration: true,
        },
      }),
      uglify()
    ],
    output: {
      file: 'dist/video-call-center.m.min.js',
      format: 'es',
      banner,
    },
  }
];
