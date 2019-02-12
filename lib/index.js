import {resolve} from 'path';
import {default as SVGIconBuild} from './build';

const DEFAULT_MODULE_OPTIONS = {
  sourcePath: 'assets/svg',
  targetPath: 'assets/svg/bundle',
  ext: 'js',
  es6: true,
  tpl: '',
  idSP: '_',
  svgo: null,
  renameStyles: false,
  tagName: 'svgicon',
  usePolyfill: true,
};

export default function module(moduleOptions) {
  const options = Object.assign({}, DEFAULT_MODULE_OPTIONS, moduleOptions);

  if (!options.subDir) {
    options.subDir = options.sourcePath;
  }

  this.nuxt.hook('build:before', (builder) => {
    SVGIconBuild(options);
  });

  if (options.usePolyfill) {
    this.addPlugin({
      src: resolve(__dirname, 'polyfill.plugin.js'),
      ssr: false,
    });
  }

  const srcDir = this.nuxt.options.srcDir
    .replace(this.nuxt.options.rootDir, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');

  const distPath = options.targetPath
    .replace(new RegExp(`^${srcDir}/`), '');

  this.addPlugin({
    src: resolve(__dirname, 'svgicon.template.js'),
    options: {
      tagName: options.tagName,
      distPath: distPath,
    },
  });
};
