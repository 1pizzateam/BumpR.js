import dts from "rollup-plugin-dts";

const config = [
  {
    input: "build/es6/bumpr.js",
    external: ["@1pizzateam/spock"],
    output: {
      file: "build/bumpr.mjs",
      format: "es",
      generatedCode: "es2015",
    },
  },
  {
    input: "build/es6/bumpr.d.ts",
    output: {
      file: "build/bumpr.d.mts",
      format: "es",
    },
    plugins: [dts()],
  },
];

export default config;
