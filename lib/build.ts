import {join, normalize, basename, resolve, sep} from 'path';
import fs from 'fs-plus';
import {statSync, existsSync} from 'fs';
import colors from 'colors';
import glob from 'glob';
import Svgo from 'svgo';

interface OptimizedSvg {
  data: string;
  info: {
    width: string;
    height: string
    [key: string]: any;
  }
}

export interface Options {
  sourcePath: string
  targetPath: string
  subDir: string
  ext?: string
  es6?: boolean
  tpl?: string
  idSP?: string
  renameStyles?: boolean
  svgo?: string | { [key: string]: any }
}

/**
 * build svg icon
 */
export default function build(options: Options): Promise<void> {
  return new Promise((res, reject) => {
    // the template file which to generate icon files
    const tplPath = options.tpl
        ? join(process.cwd(), options.tpl)
        : resolve(__dirname, `..${sep}default${sep}icon.tpl${options.es6 ? '.es6' : ''}.txt`);
    const tpl = fs.readFileSync(tplPath, 'utf8');
    const svgo = new Svgo(getSvgoConfig(options.svgo));

    glob(join(options.sourcePath, `**${sep}*.svg`), function(
        err: any,
        files: string[],
    ) {
      if (err) {
        reject(err);
        return;
      }

      files
          .map(filename => normalize(filename))
          .map(filename => {
            const name = basename(filename).split('.').slice(0, -1).join('.');
            const filePath = getFilePath(options.sourcePath, filename, options.subDir);
            const fullPath = join(
                options.targetPath,
                filePath,
                name + `.${options.ext}`,
            );
            return {
              filename,
              name,
              filePath,
              fullPath,
              lastMod: statSync(filename).mtimeMs
            }
          })
          .filter(isFileChanged)
          .forEach(async ({filename, name, filePath, fullPath, lastMod}, ix) => {
        let svgContent = fs.readFileSync(filename, 'utf-8');
        let result: OptimizedSvg = (await svgo.optimize(svgContent)) as OptimizedSvg;
        let data = result.data
            .replace(/<svg[^>]+>/gi, '')
            .replace(/<\/svg>/gi, '');

        // get view box
        let viewBox = getViewBox(result);

        // add pid attr, for css
        data = addPid(data);

        // rename fill and stroke. (It can restore in vue-svgicon)
        if(options.renameStyles) {
          data = renameStyle(data);
        }

        // replace element id, make sure ID is unique. fix #16
        data = changeId(data, filePath, name, options.idSP);

        // escape single quotes
        data = data.replace(/\'/g, '\\\'');

        let content = compile(tpl, {
          name: `${filePath}${name}`,
          width: parseFloat(result.info.width) || 16,
          height: parseFloat(result.info.height) || 16,
          viewBox: `'${viewBox}'`,
          data: data,
          lastMod: lastMod
        });

        try {
          fs.writeFileSync(fullPath, content, 'utf-8');
          console.log(
              colors.yellow(`Generated icon: ${filePath}${name}`),
          );

          if (ix === files.length - 1) {
            generateIndex(options, files);
            res();
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  });
}

function isFileChanged({filePath, fullPath, lastMod}) {
  if(!existsSync(join(process.cwd(), fullPath))) {
    return true;
  }

  try {
    const file = fs.readFileSync(
        fullPath,
        'utf-8',
    );

    const matches = file.match(/lastMod: '(\d+)'/i);
    const lastModOld = + matches[1];
    return lastMod !== lastModOld;
  } catch (e) {
    return true;
  }
}

// simple template compile
function compile(content: string, data: { [key: string]: any }) {
  return content.replace(/\${(\w+)}/gi, function(match, name) {
    return data[name] ? data[name] : '';
  });
}

// get file path by filename
function getFilePath(sourcePath: string, filename: string, subDir = '') {
  let filePath = filename
      .replace(resolve(sourcePath), '')
      .replace(basename(filename), '');

  if (subDir) {
    filePath = filePath.replace(subDir + sep, '');
  }

  if (/^[\/\\]/.test(filePath)) {
    filePath = filePath.substr(1);
  }

  return filePath.replace(/[\/\\]/g, sep);
}

// generate index.js, which import all icons
function generateIndex(opts: Options, files: string[], subDir = '') {
  let isES6 = opts.es6;
  let content = '';
  let dirMap: { [key: string]: any } = {};

  switch (opts.ext) {
    case 'js':
      content += '/* eslint-disable */\n';
      break;
    case 'ts':
      content += '/* tslint:disable */\n';
      break;
  }

  files.forEach(file => {
    let name = basename(file).split('.')[0];
    let filePath = getFilePath(opts.sourcePath, file, subDir);
    filePath = filePath.replace(opts.subDir + '/', '');
    let dir = filePath.split('/')[0];

    if (dir) {
      if (!dirMap[dir]) {
        dirMap[dir] = [];
        content += isES6
            ? `import './${dir}/index.js'\n`
            : `require('./${dir}/index.js')\n`;
      }
      dirMap[dir].push(file);
    } else {
      content += isES6
          ? `import './${filePath}${name}.js'\n`
          : `require('./${filePath}${name}.js')\n`;
    }
  });

  fs.writeFileSync(
      join(opts.targetPath, subDir.replace(opts.sourcePath, ''), `index.${opts.ext}`),
      content,
      'utf-8',
  );
  console.log(
      colors.green(
          `Generated ${subDir ? subDir + sep : ''}index.${opts.ext}`,
      ),
  );

  // generate subDir index.js
  for (let dir in dirMap) {
    generateIndex(opts, dirMap[dir], join(subDir, dir));
  }
}

// get svgo config
function getSvgoConfig(svgo?: string | { [key: string]: any }) {
  if (!svgo) {
    return require('../default/svgo');
  } else if (typeof svgo === 'string') {
    return require(join(process.cwd(), svgo));
  } else {
    return svgo;
  }
}

// get svg viewbox
function getViewBox(svgoResult: OptimizedSvg) {
  let viewBoxMatch = svgoResult.data.match(
      /viewBox="([-\d\.]+\s[-\d\.]+\s[-\d\.]+\s[-\d\.]+)"/,
  );
  let viewBox: string = '0 0 200 200';

  if (viewBoxMatch && viewBoxMatch.length > 1) {
    viewBox = viewBoxMatch[1];
  } else if (svgoResult.info.height && svgoResult.info.width) {
    viewBox = `0 0 ${svgoResult.info.width} ${svgoResult.info.height}`;
  }

  return viewBox;
}

// add pid attr, for css
function addPid(content: string) {
  let shapeReg = /<(path|rect|circle|polygon|line|polyline|ellipse)\s/gi;
  let id = 0;
  content = content.replace(shapeReg, function(match: string) {
    return match + `pid="${id++}" `;
  });

  return content;
}

// rename fill and stroke. (It can restore in vue-svgicon)
function renameStyle(content: string) {
  let styleShaeReg = /<(path|rect|circle|polygon|line|polyline|g|ellipse).+>/gi;
  let styleReg = /fill=\"|stroke="/gi;
  content = content.replace(styleShaeReg, function(shape: string) {
    return shape.replace(styleReg, function(styleName) {
      return '_' + styleName;
    });
  });

  return content;
}

// replace element id, make sure ID is unique. fix #16
function changeId(
    content: string,
    filePath: string,
    name: string,
    idSep = '_',
) {
  let idReg = /svgicon(\w+)/g;
  content = content.replace(idReg, function(match: string, elId: string) {
    return `svgicon${idSep}${filePath.replace(/[\\\/]/g,
        idSep)}${name}${idSep}${elId}`;
  });

  return content;
}
