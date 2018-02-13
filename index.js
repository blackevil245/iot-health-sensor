'use strict';

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline({ delimiter: '\r\n' });
const awsIot = require('aws-iot-device-sdk');

// Arduino port instance and settings
const BAUD_RATE = 9600;
const PORT_NAME = '/dev/ttyACM0';

const thingShadow = awsIot.thingShadow({
  keyPath: 'Raspberry-pi-3.private.key',
  certPath: 'Raspberry-pi-3.cert.pem',
  caPath: 'root-CA.crt',
  clientId: 'Raspberry-pi-3',
  thingName: 'Raspberry-pi-3',
  host:'a2dugt5ayi9ph9.iot.eu-west-1.amazonaws.com'
});

const arduinoPort = new SerialPort(PORT_NAME, {
  baudRate: BAUD_RATE,
  autoOpen: false,
});

function startArduinoConnection() {
  console.log(`Trying to connect to Arduino through serial port ${PORT_NAME} with baud rate ${BAUD_RATE}`)
  arduinoPort.open();

  arduinoPort.on('error', e => {
    console.log('Received error: ', e);
  });

  arduinoPort.on('close', () => {
    console.log('Closing connection.');
  });

  // Handle the sensor error
  parser.on('error', error => {
    throw error;
  });

  arduinoPort.on('open', () => {
    console.log('Successfully established connection to Arduino port ' + PORT_NAME + ' with ' + BAUD_RATE + ' baud rate.');

    // Handle the data sent from the arduino
    arduinoPort.pipe(parser);

    thingShadow.on('connect', () => {
      console.log('Thing shadow connected');

      thingShadow.register('Pulse', {}, () => {

        // Handle the sensor data
        parser.on('data', data => {
          try {
            const parsedData = JSON.parse(data);
            thingShadow.update('Pulse', {
              state: {
                desired: {
                  sensor: parsedData,
                },
              },
            });
          } catch (e) {
            console.log('Malformed data format, ignoring. Error: ', e.message);
          }
        });

        thingShadow.on('status', (thingName, stat, clientToken, stateObject) => {
          console.log(`Received ${stat} on ${thingName}: ${JSON.stringify(stateObject)}`);
        });

        thingShadow.on('timeout',(thingName, clientToken) => {
          console.log(`Received timeout on ${thingName} with token ${clientToken}}`);
        });
      });
    });
  });
}

try {
	startArduinoConnection();
} catch (error) {
	console.error(error.message);
	console.error(error.stack);
	process.exit(1);
}
