#!/usr/bin/env node
/**
 * 发布助手：校验 → 跑检查 → 升版本并打 tag → 发布到 npm → 推送 → 建 GitHub Release。
 *
 *   node scripts/release.mjs patch            # 0.2.0 → 0.2.1
 *   node scripts/release.mjs minor            # 0.2.0 → 0.3.0
 *   node scripts/release.mjs major            # 0.2.0 → 1.0.0
 *   node scripts/release.mjs 1.0.0-rc.1       # 指定版本
 *
 * 选项：
 *   --dry-run      只检查和打印计划，不改动任何东西
 *   --no-checks    跳过 typecheck / lint / test（不推荐）
 *   --no-publish   只升版本、打 tag、推送，不发布到 npm
 *   --no-push      不推送 git 提交与 tag
 *   --no-release   不创建 GitHub Release
 *   --allow-dirty  允许工作区不干净（危险，默认禁止）
 *
 * 任何一步失败都会立即停止，并在结尾打印回滚命令。
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const argv = process.argv.slice(2)
const flags = new Set(argv.filter((arg) => arg.startsWith('--')))
const target = argv.find((arg) => !arg.startsWith('--'))

const dryRun = flags.has('--dry-run')
const skipChecks = flags.has('--no-checks')
const skipPublish = flags.has('--no-publish')
const skipPush = flags.has('--no-push')
const skipRelease = flags.has('--no-release')
const allowDirty = flags.has('--allow-dirty')

const USAGE = `用法: node scripts/release.mjs <patch|minor|major|x.y.z> [选项]

选项:
  --dry-run      只检查和打印计划，不改动任何东西
  --no-checks    跳过 typecheck / lint / test
  --no-publish   不发布到 npm
  --no-push      不推送 git 提交与 tag
  --no-release   不创建 GitHub Release
  --allow-dirty  允许工作区不干净`

/** 含空格或 shell 特殊字符的参数加双引号；其余原样拼接。 */
function quoteArg(arg) {
  return /[\s()&|<>^"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg
}

function commandLine(command, args) {
  return [command, ...args.map(quoteArg)].join(' ')
}

function run(command, args) {
  console.log(`\n$ ${commandLine(command, args)}`)
  try {
    execSync(commandLine(command, args), { cwd: root, stdio: 'inherit' })
  } catch {
    fail(`命令失败：${commandLine(command, args)}`)
  }
}

function capture(command, args) {
  return execSync(commandLine(command, args), { cwd: root, encoding: 'utf8' }).trim()
}

function succeeds(commandLine) {
  try {
    execSync(commandLine, { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function fail(message) {
  console.error(`\n✖ ${message}`)
  console.error('\n回滚（如果已经升过版本）：')
  console.error('  git tag -d v<新版本> && git reset --hard HEAD~1')
  process.exit(1)
}

function readPackage() {
  return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/.exec(version)
  if (match === null) return undefined
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
}

function bump(current, kind) {
  const parsed = parseVersion(current)
  if (parsed === undefined) fail(`当前版本号无法解析：${current}`)
  if (kind === 'major') return `${parsed.major + 1}.0.0`
  if (kind === 'minor') return `${parsed.major}.${parsed.minor + 1}.0`
  if (kind === 'patch') return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`
  return kind
}

function ownerRepo(pkg) {
  const url = typeof pkg.repository === 'object' ? pkg.repository.url : pkg.repository
  return String(url)
    .replace(/^git\+/, '')
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
}

if (target === undefined || target === '--help' || target === '-h') {
  console.log(USAGE)
  process.exit(target === undefined ? 1 : 0)
}

const pkg = readPackage()
const nextVersion = bump(pkg.version, target)
if (parseVersion(nextVersion) === undefined) fail(`目标版本号不合法：${nextVersion}`)
if (nextVersion === pkg.version) fail(`目标版本与当前版本相同：${pkg.version}`)

console.log(`包名    : ${pkg.name}`)
console.log(`当前版本: ${pkg.version}`)
console.log(`目标版本: ${nextVersion}`)

// 1. 工作区必须干净：升版本提交会带上所有已跟踪文件。
if (!allowDirty) {
  const dirty = capture('git', ['status', '--porcelain'])
  if (dirty !== '') {
    console.error(dirty)
    fail('工作区不干净，先提交或 stash（或用 --allow-dirty 跳过此检查）')
  }
}

const branch = capture('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
if (branch !== 'main') console.warn(`\n⚠ 当前分支是 ${branch}，不是 main`)

// 2. 目标版本不能在 npm 上已存在（存在就会发布失败，提前失败更清楚）。
let alreadyPublished = false
try {
  alreadyPublished = capture('npm', ['view', `${pkg.name}@${nextVersion}`, 'version']) !== ''
} catch {
  alreadyPublished = false // npm view 对不存在的版本以非 0 退出
}
if (alreadyPublished) fail(`npm 上已经存在 ${pkg.name}@${nextVersion}`)

const tag = `v${nextVersion}`

if (dryRun) {
  console.log('\n[dry-run] 将执行：')
  if (!skipChecks) console.log('  pnpm typecheck && pnpm lint && pnpm test')
  console.log(`  npm version ${nextVersion} -m "chore(release): ${tag}"`)
  if (!skipPublish) console.log('  npm publish')
  if (!skipPush) console.log(`  git push origin HEAD && git push origin ${tag}`)
  if (!skipRelease) console.log(`  gh release create ${tag} --generate-notes --title ${tag}`)
  console.log('\n[dry-run] 没有做任何改动。')
  process.exit(0)
}

// 3. 检查。
if (!skipChecks) {
  run('pnpm', ['typecheck'])
  run('pnpm', ['lint'])
  run('pnpm', ['test'])
}

// 4. 升版本：npm version 写 package.json、提交、打 tag。
run('npm', ['version', nextVersion, '-m', `chore(release): ${tag}`])

// 5. 发布（prepublishOnly 会再跑一遍 build + test）。
if (!skipPublish) {
  console.log(`\n$ npm publish`)
  try {
    execSync('npm publish', { cwd: root, stdio: 'inherit' })
    console.log(`\n✔ 已发布 ${pkg.name}@${nextVersion} 到 npm`)
  } catch {
    console.error('\n✖ npm publish 失败。')
    console.error('  若提示 EOTP / 需要 Security key 授权：npm 11 的分阶段发布要求交互式终端。')
    console.error('  请在能打开浏览器的终端里执行：')
    console.error('    npm publish')
    console.error('  发布成功后手动推送：')
    console.error(`    git push origin HEAD && git push origin ${tag}`)
    console.error('  版本提交与 tag 已保留在本地，不需要回滚。')
    process.exit(1)
  }
} else {
  console.log('\n跳过 npm publish（--no-publish）')
}

// 6. 推送提交与 tag。
if (!skipPush) {
  run('git', ['push', 'origin', 'HEAD'])
  run('git', ['push', 'origin', tag])
} else {
  console.log('\n跳过 git push（--no-push）')
}

// 7. GitHub Release。
if (!skipRelease && !skipPush) {
  if (succeeds('gh --version')) {
    run('gh', ['release', 'create', tag, '--generate-notes', '--title', tag])
  } else {
    console.log('\n未找到 gh CLI，跳过 Release；可手动在 GitHub 上为该 tag 建 Release。')
  }
}

console.log('\n总结')
console.log(`  版本    ${pkg.name}@${nextVersion}`)
console.log(`  tag     ${tag}`)
if (!skipPublish) console.log(`  npm     https://www.npmjs.com/package/${pkg.name}`)
if (!skipPush) console.log(`  release https://github.com/${ownerRepo(pkg)}/releases/tag/${tag}`)
