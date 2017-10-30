import React, { Component } from 'react'
import './App.css'

const WIRE_COLORS = ['black', 'white', 'blue', 'pink']

// How frequently we poll the server for changes
const POLL_FREQUENCY = 100 // ms
const POLL_TIMEOUT = 1500 // ms

const SERVER_URL = 'http://localhost:3000'

const fetchServer = path => {
  function timeout(ms, promise) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        reject(new Error('timeout'))
      }, ms)
      promise.then(resolve, reject)
    })
  }
  return timeout(POLL_TIMEOUT, fetch(`${SERVER_URL}/${path}`))
  .then(response => response.json())
  .catch(error => {
    // alert('Whoops! The game broke. Check the error console.')
    console.error(error)
  })
}

class Port extends Component {

  render() {
    const wireColor = (this.props.wire === null) ? 'none' : WIRE_COLORS[this.props.wire]
    const isOnline = this.props.isOnline
    return (
      <div className={`Port Wire-${wireColor}`} onClick={this.props.cycleWire}>
        <div className="Port-wire-label">{this.props.wire}</div>
        <div
          className={`Port-status Port-status-${isOnline ? 'online' : 'offline'}`}
          onClick={this.props.disconnectWire}
        />
      </div>
    )
  }

}

class App extends Component {

  constructor(props) {
    super(props)

    this.state = {}
    this.onPollTimer()
    setInterval(this.onPollTimer.bind(this), POLL_FREQUENCY)
  }

  onPollTimer() {
    fetchServer('state')
    .then(state => this.setState(state))
  }

  connectWire(wire, port, bay) {
    fetchServer(`connect/wire/${wire}/port/${port}/bay/${bay}`)
    .then(state => this.setState(state))
  }

  disconnectWire(port, bay) {
    fetchServer(`disconnect/port/${port}/bay/${bay}`)
    .then(state => this.setState(state))
  }

  cycleWire(port, bay) {
    const numWires = 4
    const currentWire = this.state.bays[bay][port].wire
    if (currentWire === null) {
      this.connectWire(0, port, bay)
    }
    else if (currentWire + 1 === numWires) {
      this.disconnectWire(port, bay)
    } else {
      const nextWire = currentWire + 1
      this.connectWire(nextWire, port, bay)
    }
  }

  render() {
    if (!this.state.bays) return "loading"
    return (
      <div className="App">
        <div className="Combos">{this.state.combos}</div>
        <div className="Bays">
          {
            this.state.bays.map((ports, bayNum) => (
              <div className="Bay" key={bayNum}>
                <div className="Bay-name">{`Bay ${bayNum}`}</div>
                {
                  ports.map((attrs, portNum) => (
                    <Port
                      key={portNum}
                      cycleWire={() => this.cycleWire(portNum, bayNum)}
                      disconnectWire={() => this.disconnectWire(portNum, bayNum)}
                      {...attrs}
                    />
                  ))
                 }
              </div>
            ))
          }
        </div>
      </div>
    );
  }

}

export default App;
