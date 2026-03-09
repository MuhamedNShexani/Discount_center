module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        { module: /stylis-plugin-rtl/ },
      ];
      return webpackConfig;
    },
  },
};
