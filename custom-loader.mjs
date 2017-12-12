import url from 'url';
import path from 'path';
import process from 'process';
import fs from 'fs';
import os from 'os';

// 从package.json中
// 的dependencies、devDependencies获取项目所需npm模块信息
const ROOT_PATH = process.cwd();
const PKG_JSON_PATH = path.join(ROOT_PATH, 'package.json');
const PKG_JSON_STR = fs.readFileSync(PKG_JSON_PATH, 'binary');
const PKG_JSON = JSON.parse(PKG_JSON_STR);
const OS_TYPE = os.type();
// 项目所需npm模块信息
const allDependencies = {
	...PKG_JSON.dependencies || {},
	...PKG_JSON.devDependencies || {}
};

// Node原生模信息
const builtins = new Set(Object.keys(process.binding('natives')).filter(str =>
	/^(?!(?:internal|node|v8)\/)/.test(str)));

// 文件引用兼容后缀名
const JS_EXTENSIONS = new Set(['.js', '.mjs']);
const JSON_EXTENSIONS = new Set(['.json']);

// 递归获取path下的所有目录
const ignoreDir = ['node_modules', 'temp'];
function getAllDir(dirname) {
	let dirs = fs.readdirSync(dirname)
	.filter(dir => !ignoreDir.includes(dir) && dir[0] !== '.' && fs.statSync(path.join(dirname, dir)).isDirectory())
	.map(dir => path.join(dirname, dir));
	dirs.forEach((dir) => {
		dirs = dirs.concat(getAllDir(dir));
	});
	return dirs;
}
const projectDirs = getAllDir(ROOT_PATH);


export function resolve(specifier, parentModuleURL, defaultResolve) {
	// 判断是否为Node原生模块
	if (builtins.has(specifier)) {
		return {
			url: specifier,
			format: 'builtin'
		};
	}

	// 判断是否为npm模块
	if (allDependencies && typeof allDependencies[specifier] === 'string') {
		return defaultResolve(specifier, parentModuleURL);
	}

	// 如果是文件引用，判断是否路径格式正确
	if (/^\.{0,2}[/]/.test(specifier) !== true && !specifier.startsWith('file:')) {
		throw new Error(`imports must begin with '/', './', or '../'; '${specifier}' does not`);
	}

	// 判断是否为*.js、*.mjs、*.json文件
	const resolved = new url.URL(specifier, parentModuleURL);
	const ext = path.extname(resolved.pathname);
	if (!ext) { // 可能是一个目录
		const pathname = path.join(resolved.pathname).slice(OS_TYPE === 'Windows_NT' ? 1 : 0);
		if (projectDirs.includes(pathname)) {
			return {
				url: `${resolved.href}${path.sep}index.js`,
				format: 'esm'
			};
		} else if (projectDirs.includes(path.dirname(pathname))) { // 项目文件，忽略了后缀名
			return {
				url: `${resolved.href}.js`,
				format: 'esm'
			};
		}
	} else if (!JS_EXTENSIONS.has(ext) && !JSON_EXTENSIONS.has(ext)) {
		throw new Error(`Cannot load file with non-JavaScript file extension ${ext}.`);
	} else if (JS_EXTENSIONS.has(ext)) { // 如果是*.js、*.mjs文件
		return {
			url: resolved.href,
			format: 'esm'
		};
	} else if (JSON_EXTENSIONS.has(ext)) {
		return {
			url: resolved.href,
			format: 'json'
		};
	}
}
