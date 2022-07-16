#!/usr/bin/env node
// spell-checker:ignore (options) nargs (packages/utils) execa globby
'use strict';

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
	// note: 'fast-glob' expects POSIX-like file path patterns
	const source = options.source.map(pathToPOSIX);
	const target = options.target.map(pathToPOSIX);

	const sourceFileStats = await matchFiles(source);
	const targetFileStats = await matchFiles(target);

	// console.warn({ options, sourceFileStats, targetFileStats });

	const anyMissingNonGlobTargets = target
		.filter((filePattern) => {
			if (!glob.isDynamicPattern(filePattern)) return filePattern;
		})
		.find((nonGlobFilePattern) => !fs.existsSync(nonGlobFilePattern))
		? true
		: false;

	// console.warn({ anyMissingNonGlobTargets });

	if (anyMissingNonGlobTargets || isAnySourceNewer(sourceFileStats, targetFileStats)) {
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
	}

	process.exit(0);
}

function matchFiles(fileGlob) {
	const isWinOS = /^win/i.test(process.platform);
	const GLOB_OPTIONS = { caseSensitiveMatch: isWinOS ? false : true, stats: true };
	return glob(fileGlob, GLOB_OPTIONS);
}

function isAnySourceNewer(sourceFileStats, targetFileStats) {
	const toModifiedDate = (file) => new Date(file.stats.mtimeMs);

	const toEarliestDate = (earliestDate, date) => {
		earliestDate ??= date;
		return date.getTime() < earliestDate.getTime() ? date : earliestDate;
	};
	const toLatestDate = (latestDate, date) => {
		latestDate ??= date;
		return date.getTime() > latestDate.getTime() ? date : latestDate;
	};

	const earliestTargetDate = targetFileStats.map(toModifiedDate).reduce(toEarliestDate, undefined);
	const latestSourceDate = sourceFileStats
		.map(toModifiedDate)
		.reduce(toLatestDate, earliestTargetDate);

	// console.warn({
	// 	sourceDates: sourceFileStats.map(toModifiedDate),
	// 	latestSourceDate,
	// 	targetDates: targetFileStats.map(toModifiedDate),
	// 	earliestTargetDate,
	// });

	if (latestSourceDate == null) return false;
	if (earliestTargetDate == null) return true;
	return latestSourceDate.getTime() > earliestTargetDate.getTime();
}

function parseCommand(options) {
	if (options._ && options._.length) {
		return options._.join(' ');
	} else {
		throw new Error('Missing command');
	}
}

function pathToPOSIX(p) {
	// ToDO: convert to use of $path.SEP_PATTERN
	return p.replace(/\\/g, '/');
}
