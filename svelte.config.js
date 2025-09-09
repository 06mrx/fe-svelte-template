import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // penting! SPA fallback
      precompress: false,
      strict: true
    }),
    paths: {
      base: '',
    //   assets: '/'  // absolute path untuk _app
    },
    prerender: {
      handleUnseenRoutes: 'ignore',
      handleMissingId: 'ignore'
    }
  }
};

export default config;
