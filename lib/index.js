import {resolve} from 'path';
import {default as SVGIconBuild} from 'vue-svgicon/dist/lib/build';

const DEFAULT_MODULE_OPTIONS = {
  sourcePath: 'svg',
  targetPath: 'svg-bundle',
  ext: 'js',
  es6: false,
  tpl: '',
  idSP: '_',
  svgo: {},
  tagName: 'svgicon',
  usePolyfill: true
};

export default function SVGIconModule (moduleOptions) {
  const options = Object.assign({}, DEFAULT_MODULE_OPTIONS, moduleOptions);

  this.extendBuild((config, {isClient, isServer}) => {
    SVGIconBuild(options);
  });

  if(options.usePolyfill) {
    this.addPlugin({
      src: resolve(__dirname, 'polyfill.plugin.js'),
      ssr: false
    });
  }

  this.addPlugin({
    src: resolve(__dirname, 'svgicon.template.js'),
    options: {
      tagName: options.tagName,
      distPath: options.targetPath
    },
  });
};