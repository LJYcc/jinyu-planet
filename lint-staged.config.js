export default {
  '*.{js,ts,vue,jsx,tsx}': ['npm run lint-staged:eslint', 'npm run lint-staged:prettier', 'npm run lint-staged:spell'],

  // 对样式、JSON 等文件：仅格式化
  '*.{css,scss,less,json,md,html}': ['npm run lint-staged:prettier'],
  // 文档拼写检查
  '*.{md,html}': ['npm run lint-staged:spell']
};
