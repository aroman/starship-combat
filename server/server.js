const express = require('express')
const _ = require('lodash')
const app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

const NUM_BAYS = 2
const PORTS_PER_BAY = 4

const makeBay = size => Array(size).fill().map((_, i) => ({
	wire: null,
	isOnline: true,
}))

let bays = Array(NUM_BAYS).fill().map(() => makeBay(4))

// null => no wire present
// undefined => wildcard
// n => wire n
let combos = [
  {
    name: 'REBOOT',
    sequence: [[0,1,null,null],[0,1,null,null]],
  },
  {
    name: 'BOOST_SHIELDS',
    sequence: [['*','*',2,3],['*','*','*','*']],
  },
  {
    name: 'BOOST_SHIELDS',
    sequence: [['*','*','*','*'],['*','*',2,3]],
  },
  {
    name: 'BAY_0_EMPTY',
    sequence: [[null,null,null,null],['*','*','*','*']],
  },
  {
    name: 'PHASERS',
    sequence: [[0,1,2,'*'],['*','*','*','*']],
  },
]

const componentMatches = ([a, b]) => (a === '*') || (b === '*') || (a === b)
const sequenceMatches = (A, B) => _.zip(_.flatten(A), _.flatten(B)).every(componentMatches)
const baysToSequence = bays => bays.map(bay => bay.map(({wire}) => wire))
const getCombos = (bays, combos) =>
  combos
  .filter(({_, sequence}) => sequenceMatches(baysToSequence(bays), sequence))
  .map(({name, _}) => name)

const serializeState = bays => ({ bays, combos: getCombos(bays, combos) })
const sendStateAsJson = res => res.json(serializeState(bays, combos))

app.get('/connect/wire/:wire/port/:port/bay/:bay', (req, res) => {
	const wire = Number(req.params.wire)
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	console.log(`connected wire ${wire} to port ${port} bay ${bay}`)
	bays[bay][port].wire = wire
	sendStateAsJson(res)
})

app.get('/disconnect/port/:port/bay/:bay', (req, res) => {
	const bay = Number(req.params.bay)
	const port = Number(req.params.port)
	const wire = bays[bay][port].wire
	if (wire === null) {
		console.log(`WARNING: no wire is plugged in to ${port} bay ${bay}`)
	} else {
		console.log(`disconnected wire ${wire} from port ${port} bay ${bay}`)
		bays[bay][port].wire = null
	}
	sendStateAsJson(res)
})

app.get('/state', (req, res) => {
	sendStateAsJson(res)
})

app.listen(3000, function () {
  // addAlreadyPluggedInDevices()
  console.log('Serving on port 3000')
})
