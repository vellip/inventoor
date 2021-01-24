module.exports = {
  devServer: {
    https: true,
    inline: false,
    headers: {
      'Cache-Control': 'no-store',
      Vary: '*',
    },
  },
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
}
