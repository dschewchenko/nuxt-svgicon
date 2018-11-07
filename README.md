# nuxt-svgicon module

[![npm version](https://badge.fury.io/js/nuxt-svgicon.svg)](https://badge.fury.io/js/nuxt-svgicon)

Nuxt module for integration [vue-svgicon](https://github.com/MMF-FE/vue-svgicon)
In short - nuxt module to create svg icon components.
At build or starting dev it will generate icons.

All svg icons will be inlined in html, when You use SSR or generate :)

I have modified vue-svgicon builder for better support sub-directories.

## Install

```bash
npm i nuxt-svgicon
# or
yarn add nuxt-svgicon
```

## Usage
In **nuxt.config.js** add module:
```js
{
  modules: [
    // simple usage
    'nuxt-svgicon',
    // or
    // with options
    ['nuxt-svgicon', { /* svgicon options */ }]
 ]
}
```

## Options
Same as in [vue-svgicon](https://github.com/MMF-FE/vue-svgicon#options), but with some additions :)
I use `assets/svg` as root path for svg, because it's recommended by nuxt community to use assets directory
#### Default config
```js
{
  sourcePath: 'assets/svg',
  targetPath: 'assets/svg/bundle',
  subDir: 'assets/svg',
  ext: 'js',
  es6: false,
  tpl: '',
  idSP: '_',
  svgo: null, // use default vue-svgicon config
  renameStyles: false,
  tagName: 'svgicon',
  usePolyfill: true
}
```
### subDir
Root dir for generating namespaces. May to be the same as sourcePath for start namespacing from root. For example if `subDir: 'assets'` and `sourcePath: 'assets/svg'`, all svg icon names will start with `svg/` namespace (example `svg/icon_name`).

### usePolyfill
If `true` will automatically add `innersvg-polyfill` for supporting IE and old browsers.

### renameStyles
By default I have disabled renaming of svg styles `fill` and `stroke`. Because in some svg it doesn't work properly. If true, than You can use currentColor feature for coloring icons.

