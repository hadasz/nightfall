module.exports = {
  extends: ['codfish', 'codfish/docker', 'codfish/dapp'],
  root: true,
  rules: {
    'no-console': 'off',
    'space-before-function-paren': ['error', 'always'],
    'no-use-before-define': 'off',
    'radix': 'off',
    // 'multiline-ternary': ['error', 'never'],
    // 'prettier/prettier': 'off',   // make prettier config off
    'quotes': ['error', 'single'],
    'comma-dangle': ['error', 'always-multiline'],
    'semi': 'error',
    'no-extra-semi': 'error',
    'indent': ['error', 2],
  }
};