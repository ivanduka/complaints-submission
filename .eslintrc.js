module.exports = {
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true,
  },
  extends: ["airbnb", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  rules: {
    "no-console": "off",
    "no-param-reassign": ["error", { props: false }],
    "arrow-body-style": ["error", "as-needed"],
    "no-underscore-dangle": "off",
    "comma-dangle": [
      "error",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "always-multiline",
      },
    ],
  },
};
