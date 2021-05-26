module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: '14' }, modules: 'commonjs' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@/': './src',
          '@config': './src/config',
          '@games': './src/games',
          '@schemas': './src/schemas'
        }
      }
    ]
  ]
}
