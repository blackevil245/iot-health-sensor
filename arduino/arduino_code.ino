
int BAUD_RATE = 9600;
int Signal;
int Threshold = 550;
int PulseSensorPurplePin = 0;

void setup() {
  Serial.begin(BAUD_RATE);
}

void loop() {
  // put your main code here, to run repeatedly:
  Signal = analogRead(PulseSensorPurplePin);
  Serial.println(Signal);

  delay(100);
}
