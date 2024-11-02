//----------------------------------------Incluir bibliotecas
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
//----------------------------------------

#define PulseSensor_PIN 36
#define Button_PIN 32
#define LED_PIN 23
#define SAMPLING_TIME 60000 // 1 minuto en milisegundos

//----------------------------------------Configurar el tamaño de la pantalla OLED en píxeles
#define SCREEN_WIDTH 128 //--> Ancho de la pantalla OLED, en píxeles
#define SCREEN_HEIGHT 64 //--> Alto de la pantalla OLED, en píxeles
//----------------------------------------

//----------------------------------------Declaración para una pantalla SSD1306 conectada a I2C (pines SDA, SCL)
#define OLED_RESET -1 // Pin de reinicio # (o -1 si se comparte el pin de reinicio de Arduino)
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH,
SCREEN_HEIGHT, &Wire, OLED_RESET);
//----------------------------------------


// UUIDs para el servicio y la característica
#define SERVICE_UUID        "91bad492-b950-4226-aa2b-4ede9fa42f59"
#define CHARACTERISTIC_UUID "cba1d466-344c-4be3-ab3f-189f80dd7518"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;
int valor = 0;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Dispositivo conectado");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Dispositivo desconectado");
    // Opcional: iniciar publicidad nuevamente si quieres permitir la reconexión automática
    pServer->startAdvertising();
  }
};

unsigned long previousMillisGetHB = 0; //--> almacenará la última vez que se actualizó Millis (para obtener los latidos del corazón).
unsigned long previousMillisResultHB = 0; //--> almacenará la última vez que se actualizó Millis (para obtener las pulsaciones por minuto).

unsigned long startTime = millis();

const long intervalGetHB = 20; //--> Intervalo para leer la frecuencia cardíaca (latidos) = 20ms.
const long intervalResultHB = 1000; //--> El intervalo de lectura para el resultado del cálculo de la frecuencia cardíaca.

int timer_Get_BPM = 0;

int Signal;
boolean beat = false;
boolean show_rate = true;
boolean test_stopped = false;
int seconds = 0;
int bpmValues[120]; // Array para almacenar las pulsaciones por minuto durante 1 minuto
int BPM;
unsigned long lastBeatTime = 0;
unsigned long thisBeatTime = 0;

int PulseSensorSignal; //--> Variable para alojar el valor de la señal del sensor.
int UpperThreshold = 485;

int LowerThreshold = 480;

int cntHB = 0; //--> Variable para contar el número de latidos del corazón.
boolean ThresholdStat = true; //--> Variable para activadores en el cálculo de latidos del corazón.
int BPMval = 0; //--> Variable para almacenar el resultado del cálculo de latidos del corazón.

int x = 0; //--> Variable de los valores del eje x del gráfico para mostrar en OLED
int y = 0; //--> Variable de los valores del eje y del gráfico para mostrar en OLED
int lastx = 0; //--> Variable del último valor del eje x del gráfico para mostrar en OLED
int lasty = 0; //--> Variable del último valor del eje y del gráfico para mostrar en OLED
int pulses_index = 0;

// Variables booleanas para comenzar y detener la obtención de valores de PPM.
bool get_BPM = false;

//----------------------------------------'Heart_Icon', 16x16px
// Dibujé este ícono de corazón en: http://dotmatrixtool.com/

const unsigned char Heart_Icon [] PROGMEM = {
0x00, 0x00, 0x18, 0x30, 0x3c, 0x78, 0x7e, 0xfc, 0xff, 0xfe, 0xff, 0xfe, 0xee,
0xee, 0xd5, 0x56,
0x7b, 0xbc, 0x3f, 0xf8, 0x1f, 0xf0, 0x0f, 0xe0, 0x07, 0xc0, 0x03, 0x80,
0x01, 0x00, 0x00, 0x00
};

//__void GetHeartRate()
void GetHeartRate() {
//----------------------------------------Proceso de lectura del latido del corazón.
unsigned long currentMillisGetHB = millis();

if (currentMillisGetHB - previousMillisGetHB >= intervalGetHB) {
previousMillisGetHB = currentMillisGetHB;

PulseSensorSignal = analogRead(PulseSensor_PIN); //--> Lee el valor del sensor PulseSensor. Asigna este valor a la variable "Signal".

if (PulseSensorSignal > UpperThreshold && ThresholdStat == true) {
if (get_BPM == true) cntHB++;
ThresholdStat = false;
}

if (PulseSensorSignal < LowerThreshold) {

ThresholdStat = true;
}

DrawGraph(); //--> Llama a la subrutina DrawGraph().
}
//----------------------------------------

//----------------------------------------El proceso para obtener el valor de PPM.
unsigned long currentMillisResultHB = millis();

if (get_BPM == true) {

Signal = analogRead(PulseSensor_PIN);

Serial.println(Signal);
if(Signal > UpperThreshold && !beat){
beat = true;
thisBeatTime = millis();
BPM = 60000 / (thisBeatTime - lastBeatTime);

lastBeatTime = thisBeatTime;
if(BPM >= 50 && BPM <= 120){
bpmValues[pulses_index++] = BPM;
Serial.println("BPM: " + String(BPM));

}
}

if(Signal < LowerThreshold){
beat = false;
}

if(seconds < (millis() - startTime)/1000 && BPM){
digitalWrite(LED_PIN,HIGH);
delay(50);
digitalWrite(LED_PIN,LOW);
}

delay(20);

display.fillRect(20, 48, 108, 18, SH110X_BLACK);

display.drawBitmap(0, 47, Heart_Icon, 16, 16, SH110X_WHITE); //--> display.drawBitmap(posición x, posición y, datos del bitmap, ancho del abitmap, alto del bitmap, color)
display.drawLine(0, 43, 127, 43, SH110X_WHITE); //--> drawLine(x1, y1, x2, y2, color)

display.setTextSize(2);

display.setTextColor(SH110X_WHITE);
display.setCursor(92, 48); //--> (posición x, posición y)
display.print((SAMPLING_TIME - (millis() - startTime))/1000);
seconds = (millis() - startTime)/1000;
display.print("s");
display.display();

if(millis() - startTime > SAMPLING_TIME){
test_stopped = true;
}

}

//----------------------------------------
}
//____________________________

//__DrawGraph()
// Subrutinas para dibujar o mostrar señales gráficas de frecuencia cardíaca.
void DrawGraph() {
//----------------------------------------Condición para restablecer la pantalla gráfica si llena el ancho de la pantalla OLED.
if (x > 127) {

display.fillRect(0, 0, 128, 42, SH110X_BLACK);
x = 0;
lastx = 0;
}
//----------------------------------------

//----------------------------------------Procesar datos de señal para mostrar en OLED en forma gráfica.
int ySignal = PulseSensorSignal;

if (ySignal > 850) ySignal = 850;
if (ySignal < 350) ySignal = 350;

int ySignalMap = map(ySignal, 350, 850, 0, 40); //--> El eje y utilizado en OLED es de 0 a 40.

y = 40 - ySignalMap;
//----------------------------------------

//----------------------------------------Muestra el gráfico de frecuencia cardíaca.
display.writeLine(lastx, lasty, x, y, SH110X_WHITE);
display.display();
//----------------------------------------

lastx = x;
lasty = y;

x++;
}
//____________________________

//__VOID SETUP()
void setup() {
// Código de configuración, se ejecuta una vez:



Serial.begin(115200);  // Inicializa el puerto serial para debug


  Serial.begin(115200);

  // Inicializa el dispositivo BLE
  BLEDevice::init("Latidos que Cuentan");

  // Crea el servidor BLE
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Crea el servicio BLE
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Crea la característica BLE para enviar el valor
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  // Añade descriptor BLE2902 (necesario para las notificaciones en BLE)
  pCharacteristic->addDescriptor(new BLE2902());

  // Inicia el servicio BLE
  pService->start();

  // Inicia la publicidad BLE para que el dispositivo sea visible
  pServer->getAdvertising()->start();
  Serial.println("Esperando conexión BLE...");

delay(2000);

analogReadResolution(10);

pinMode(Button_PIN, INPUT_PULLUP);
pinMode(LED_PIN, OUTPUT);

//---------------------------------------- SSD1306_SWITCHCAPVCC = generar voltaje de pantalla desde 3.3V internamente.
// Dirección 0x3C para 128x32 y Dirección 0x3D para 128x64.

// Pero en mi módulo de 128x64 la dirección 0x3D no funciona. Lo que funciona es la dirección 0x3C.
// Así que prueba qué dirección funciona en tu módulo.
if (!display.begin(0x3c, true)) {
Serial.println(F("Fallo de asignación SSD1306"));
for (;;); //--> No proceda, haga un bucle para siempre
}
//----------------------------------------

display.clearDisplay();
display.setTextColor(SH110X_WHITE);
display.setTextSize(2);
display.setCursor(37, 0);
display.print("LATIDOSs");
display.setCursor(13, 20);
display.print("QUE");
display.setCursor(7, 40);
display.print("CUENTAN");
display.display();
delay(2000);

display.clearDisplay();
display.drawLine(0, 43, 127, 43, SH110X_WHITE); //--> drawLine(x1, y1, x2, y2, color)

display.setTextSize(2);
display.setTextColor(SH110X_WHITE);
display.setCursor(10, 48); //--> (posición x, posición y)
display.print("Frec. Card.");
display.display();
}
//____________________________

//__VOID LOOP()
void loop() {
// Código principal, se ejecuta repetidamente:

if (digitalRead(Button_PIN) == LOW || test_stopped) {
delay(100);

cntHB = 0;
BPMval = 0;
x = 0;
y = 0;
lastx = 0;
lasty = 0;

get_BPM = !get_BPM;
if(!show_rate){

get_BPM = !get_BPM;
}

if (get_BPM == true) {
display.clearDisplay();
display.setTextColor(SH110X_WHITE);
display.setTextSize(1);
display.setCursor(14, 0);
display.print("Calculando PPM");

display.setTextSize(3);

for (byte i = 3; i > 0; i--) {
display.setTextColor(SH110X_WHITE);
display.setCursor(50, 20);
display.print(i);
display.display();
delay(1000);
display.setTextColor(SH110X_BLACK);
display.setCursor(50, 20);
display.print(i);
display.display();
}

delay(500);

//----------------------------------------Muestra información de lectura de valor de PPM
display.clearDisplay();
display.setTextSize(1);
display.setTextColor(SH110X_WHITE);

display.setCursor(0, 12); //--> (posición x, posición y)
display.print(" Porfavor espera");

display.setCursor(0, 22); //--> (posición x, posición y)
display.print(" 10 segundos");

display.setCursor(0, 32); //--> (posición x, posición y)
display.print(" para obtener");

display.setCursor(0, 42); //--> (posición x, posición y)
display.print(" las PPM");

display.display();
delay(3000);
startTime = millis();
//----------------------------------------

//----------------------------------------Muestra la visualización inicial del valor de PPM
display.clearDisplay(); //--> para limpiar la pantalla

display.drawBitmap(0, 47, Heart_Icon, 16, 16, SH110X_WHITE); //--> display.drawBitmap(posición x, posición y, datos del bitmap, ancho delbitmap, alto del bitmap, color)

display.drawLine(0, 43, 127, 43, SH110X_WHITE); //--> drawLine(x1,y1, x2, y2, color)

display.setTextSize(2);
display.setTextColor(SH110X_WHITE);
display.setCursor(20, 48); //--> (posición x, posición y)
display.print(": 0 ");
display.print("s");

display.display();
//----------------------------------------
}
else if(test_stopped){
test_stopped = false;
BPM = 0;

// Calcular el promedio de los valores más comunes en intervalos de 10 BPM
int counts[13] = {0};
for (int i = 0; i < pulses_index; ++i) {
int bin = bpmValues[i] / 10;
counts[bin]++;
}

int maxCountIndex = 0;
for (int i = 0; i < 13; ++i) {
if (counts[i] > counts[maxCountIndex]) {
maxCountIndex = i;
}
}

int sum = 0;
int count = 0;
int lowerBound = maxCountIndex * 10;
int upperBound = lowerBound + 10;

for (int i = 0; i < pulses_index; ++i) {
if (bpmValues[i] >= lowerBound && bpmValues[i] < upperBound) {
sum += bpmValues[i];

count++;
}
}

int averageBPM = sum / count;

display.clearDisplay();
display.setTextColor(SH110X_WHITE);
display.setTextSize(1);
display.setCursor(42, 25);
display.print("Obteniendo Resultados...");
display.display();
delay(2000);
display.clearDisplay();
display.setTextColor(SH110X_WHITE);
display.setTextSize(1);
display.setCursor(32, 5);
display.print("Resultado: ");
display.print(averageBPM);
display.print("PPM");
display.setCursor(32, 15);
if(averageBPM < 60){
display.print("Esta algo bajo, contacte a su medico");
}

else if(averageBPM > 90){
display.print("Tiene un PPM mas elevado de lo normal");
}

else if(averageBPM > 115){
display.print("Riesgo de arritmia");
}
else{
display.print("Corazon en buenas condiciones.");
}


  // Simulación de enviar datos cada segundo si está conectado
  if (deviceConnected) {
    String resultado = "Resultado: " + String(valor) + " PPM";
    valor = averageBPM;
    String valorString = String(valor);
    pCharacteristic->setValue(valorString.c_str());  
    pCharacteristic->notify();
    Serial.println("Valor enviado: " + resultado);
    delay(1000);
  }


display.setCursor(22, 35);
display.print("Dale al boton para reiniciar.");
display.display();
show_rate = false;
pulses_index = 0;
}

else{
test_stopped = false;
BPM = 0;
show_rate = true;
display.clearDisplay();
display.setTextColor(SH110X_WHITE);

display.setTextSize(2);
display.setCursor(42, 25);
display.print("PROCESO DETENIDO");
display.display();
delay(2000);
display.clearDisplay();
display.drawLine(0, 43, 127, 43, SH110X_WHITE); //--> drawLine(x1, y1, x2, y2, color)
display.setTextSize(2);
display.setTextColor(SH110X_WHITE);
display.setCursor(10, 48); //--> (posición x, posición y)
display.print("Frec. Card.");
display.display();
}
}

if(show_rate){

GetHeartRate();
}
}
//____________________________