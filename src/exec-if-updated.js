#!/usr/bin/env node
// spell-checker:ignore (options) nargs (packages/utils) execa globby

const yargs = require('yargs');
const glob = require('fast-glob');
const execa = require('execa');
const fs = require('fs');

const options = yargs
	.example('$0 --source src/** --source assets/** --target dist/** npm run build')
	.option('s', {
		alias: 'source',
		demandOption: true,
		describe:
			'A glob describing the source files that may be updated. May be supplied more than once for additional source files.',
		type: 'array',
		nargs: 1,
	})
	.option('t', {
		alias: 'target',
		demandOption: true,
		describe:
			'A glob describing the target files to which the source files will be compared. May be supplied more than once for additional target files.',
		type: 'array',
		nargs: 1,
	})
	.wrap(yargs.terminalWidth()).argv;

main(options);

async function main(options) {
	const sourceFiles = await matchFiles(options.source);
	const targetFileSets = await matchFiles(options.target);

	const anyMissingTargets = options.target
		.filter((v) => !glob.generateTasks(v, { case: true })[0].dynamic)
		.find((v) => !fs.existsSync(v))
		? true
		: false;

	if (anyMissingTargets || isSourceNewer(sourceFiles, targetFileSets)) {
		try {
			const command = parseCommand(options);
			const childProcess = execa.shell(command);
			childProcess.stdout.pipe(process.stdout);
			childProcess.stderr.pipe(process.stderr);
			process.stdin.pipe(childProcess.stdin);
			await childProcess;
			process.exit();
		} catch (e) {
			console.error(e.message);
			process.exit(1);
		}
	} else {
		process.exit();
	}
}

function matchFiles(fileGlob) {
	const isWinOS = /^win/i.test(process.platform);
	const GLOB_OPTIONS = {
		case: isWinOS ? false : true,
		stats: true,
	};
	return glob(fileGlob, GLOB_OPTIONS);
}

function isSourceNewer(sourceFiles, targetFiles) {
	const toModifiedDate = (file) => new Date(file.mtimeMs);
	const toEarliestModified = (earliestModifiedTime, fileModifiedTime) =>
		fileModifiedTime.getTime() < earliestModifiedTime.getTime()
			? fileModifiedTime
			: earliestModifiedTime;
	const toLatestModified = (latestModifiedTime, fileModifiedTime) =>
		fileModifiedTime.getTime() > latestModifiedTime.getTime()
			? fileModifiedTime
			: latestModifiedTime;

	const dateNow = new Date(Date.now());

	const earliestTargetDate = targetFiles.map(toModifiedDate).reduce(toEarliestModified, dateNow);
	const latestSourceDate = sourceFiles
		.map(toModifiedDate)
		.reduce(toLatestModified, earliestTargetDate);

	return latestSourceDate.getTime() > earliestTargetDate.getTime();
}

function parseCommand(options) {
	if (options._ && options._.length) {
		return options._.join(' ');
	} else {
		throw new Error('Missing command');
	}
}
