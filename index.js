'use strict';

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline({ delimiter: '\r\n' });
const awsIot = require('aws-iot-device-sdk');

// Arduino port instance and settings
const BAUD_RATE = 9600;
const PORT_NAME = '/dev/ttyACM0';

const THING_ID = 'Raspberry-pi-3';

const device = awsIot.device({
  keyPath: 'Raspberry-pi-3.private.key',
  certPath: 'Raspberry-pi-3.cert.pem',
  caPath: 'root-CA.crt',
  clientId: THING_ID,
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

    // Handle the sensor data
    parser.on('data', data => {
      try {
        const parsedData = JSON.parse(data);
        device.publish('$aws/things/' + THING_ID + '/shadow/update', JSON.stringify({
          state: {
            reported: {
              sensor: parsedData,
            },
          },
        }));


      } catch (e) {
        console.log('Malformed data format, ignoring. Error: ', e.message);
      }
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
