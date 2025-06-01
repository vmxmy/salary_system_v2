module.exports = {
  createOldCatalogs: false,
  keySeparator: false,
  namespaceSeparator: ':',
  locales: ['en', 'zh-CN'],
  defaultLng: 'zh-CN',
  defaultValue: (locale, namespace, key) => {
    if (locale === 'zh-CN') {
      return key; // 返回 key 本身作为中文默认值
    }
    return ''; // 其他语言返回空字符串
  },
  output: 'public/locales/{{lng}}/{{ns}}.json',
  input: [
    'src/**/*.{js,jsx,ts,tsx}'
  ],
  options: {
    debug: true,
    func: {
      list: ['t', 'i18n.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallbackTrans: true,
      acorn: {
        ecmaVersion: 2020,
        sourceType: 'module',
        // Check out https://github.com/acornjs/acorn/tree/master/acorn#interface
        // for more options.
      }
    },
    lngs: ['en', 'zh-CN'],
    nsSeparator: ':',
    keySeparator: '.',
    pluralSeparator: '_',
    contextSeparator: '_',
    jsonIndent: 2,
    // see below for more details
    sort: true
  }
}; 