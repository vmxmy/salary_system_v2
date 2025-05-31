module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    // 可根据需要添加其他路径
  ],
  output: './public/locales/$LOCALE/translation.json',
  options: {
    debug: false,
    removeUnusedKeys: true,
    sort: true,
    lngs: ['en', 'zh-CN'],
    defaultLng: 'zh-CN',
    defaultNs: 'translation',
    resource: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
      savePath: 'public/locales/{{lng}}/{{ns}}.json',
    },
    ns: [
      'translation',
    ],
    defaultValue: (lng, ns, key) => key,
    keySeparator: false,
    nsSeparator: false,
  },
}; 