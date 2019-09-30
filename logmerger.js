const fs = require('fs')
const adif = require('adif-gsp')

const qsosMatch = (q1, q2) => q1.call === q2.call && q1.band === q2.band && q1.mode === q2.mode // TODO remove suffixes?
const qsoIgnored = qso => qso.qsl_sent_via === 'IGNORE' || qso.qsl_sent === 'Y'

const qsos = parseLog('log.adif')
const contestQsos = parseLog('contest.adif')
if (contestQsos) {
	qsos = [...qsos, ...contestQsos]
	console.info('Total QSOs count', qsos.length)
}
// console.log(qsos[0])
//	qsos.forEach(qso => console.log(`${qso.call} ${qso.band} ${qso.mode} ${qso.qsl_sent_via}`))
findAndMarkQslIgnore(qsos)

const writer = new adif.AdiWriter("LogMerger", "1.0")
const output = writer.writeAll(qsos)
fs.writeFile('log2.adif', output, err => {
	if (err) log.error('Error writing log file', err)
	else console.info('Log log2.adif written')
})


function parseLog(logname) {
	console.info(`Loading ${logname}`)
	try {
		const data = fs.readFileSync(logname, 'utf8')
		console.info('Parsing ADIF')
		const reader = new adif.AdiReader(data)
		const qsos = reader.readAll()
		console.info('QSOs count', qsos.length)
		return qsos
	} catch (e) {
		console.info('None found or error loading it')
		return null
	}
}

function findAndMarkQslIgnore(qsos) {
	const ignored = qsos.filter(qsoIgnored)
	console.info('QSOs with QSL sent or IGNORE:', ignored.length)
	
	markQsosAsQslIgnoreFor(ignored, qsos)
	const ignTotal = qsos.filter(qsoIgnored).length
	console.info('Total remarked QSOs to QSL sent or IGNORE:', ignTotal)
	
	return ignored
}

function markQsosAsQslIgnoreFor(ignored, qsos) {
	qsos
		.filter(qso => !qso.qsl_sent_via) // not marked as IGNORE
		.filter(qso => qso.qsl_sent !== 'Y') // QSL not sent
		.filter(qso => matchIgnored(qso, ignored))
		.forEach(qso => qso.qsl_sent_via = 'IGNORE')
}

function matchIgnored(qso, ignored) {
	for (let i = 0; i < ignored.length; i++) {
		if (qsosMatch(ignored[i], qso)) return true
	}
	return false
//	return ignored
//		.filter(ign => qsosMatch(ign, qso))
//		.length > 0
}
