module.exports = {
  contextSeparator: '_',
  keySeparator: '.', // 与 i18n.ts 中的 keySeparator 一致
  namespaceSeparator: ':', // 与 i18n.ts 中的 nsSeparator 一致

  createOldCatalogs: false, // 不创建旧的 .pot 文件
  defaultNamespace: 'common', // 与 i18n.ts 中的 defaultNS 一致
  defaultValue: function(lng, ns, key, options) {
    // 在开发模式下，如果 key 缺失，返回 key 本身，方便识别
    // 对于带有计数的 key (如复数)，options.count 会被传入
    if (options && typeof options.count === 'number') {
      // 对于复数形式，可能需要更复杂的默认值逻辑，或者让 i18next 根据其规则处理
      // 这里简单返回 key，实际项目中可能需要调整
      return key;
    }
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return key; // 开发和测试时返回 key
    }
    return ''; // 生产模式下返回空字符串或特定占位符
  },
  indentation: 2, // JSON 文件缩进
  keepRemoved: ['menu'], // 从 JSON 文件中移除代码里不再使用的 key, 但保留 `menu` 命名空间下的所有键
  lexers: {
    hbs: ['HandlebarsLexer'],
    handlebars: ['HandlebarsLexer'],
    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],
    mjs: ['JavascriptLexer'],
    js: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],
    default: ['JavascriptLexer'],
  },
  lineEnding: 'auto',
  locales: ['zh-CN', 'en'], // 与 i18n.ts 中的 supportedLngs 一致
  // namespaceResolution: 'basename', // 如果你的文件名直接对应 namespace
  output: 'public/locales/$LOCALE/$NAMESPACE.json', // 输出路径和文件名结构
  input: [
    'src/**/*.{js,jsx,ts,tsx}', // 需要扫描的源文件
    // '!**/node_modules/**', // 明确排除 node_modules
    // '!src/**/*.spec.{js,jsx,ts,tsx}' // 可选：排除测试文件
  ],
  sort: true, // 对输出的 JSON 文件中的 key 进行排序，方便版本控制和查找
  useKeysAsDefaultValue: false, // 不自动使用 key 作为其默认值
  verbose: false, // 是否输出详细日志
  failOnWarnings: false, // 解析过程中遇到警告时是否失败
  // functions: ['t', 'i18n.t', 'props.t'], // 需要解析的函数名，根据实际使用情况添加
};