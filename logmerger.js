const fs = require('fs')
const adif = require('adif-gsp')

const qsosMatch = (q1, q2) => q1.call === q2.call && q1.band === q2.band && q1.mode === q2.mode // TODO remove suffixes?

console.info('Loading log.adif')
fs.readFile('log.adif', 'utf8', processLog)

function processLog(err, data) {
	if (err) {
		console.error('Error loading log file', err)
		return
	}
	
	console.info('Parsing ADIF')
	const reader = new adif.AdiReader(data)
	const qsos = reader.readAll();
	console.info('QSOs count', qsos.length)
//	qsos.forEach(qso => console.log(`${qso.call} ${qso.band} ${qso.mode} ${qso.qsl_sent_via}`))
	findAndMarkQslIgnore(qsos)
	
	const writer = new adif.AdiWriter("LogMerger", "1.0")
	const output = writer.writeAll(qsos)
	fs.writeFile('log2.adif', output, err => {
		if (err) log.error('Error writing log file', err)
		else console.info('Log log2.adif written')
	})
}

function findAndMarkQslIgnore(qsos) {
	const ignored = qsos
		.filter(qso => qso.qsl_sent_via === 'IGNORE')
	console.info('QSOs with QslSentVia IGNORE:', ignored.length)
	
	markQsosAsQslIgnoreFor(ignored, qsos)
	const ignTotal = qsos
		.filter(qso => qso.qsl_sent_via === 'IGNORE')
		.length
	console.info('Total remarked QSOs to QslSentVia IGNORE:', ignTotal)
	
	return ignored
}

function markQsosAsQslIgnoreFor(ignored, qsos) {
	qsos
		.filter(qso => !qso.qsl_sent_via)
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
