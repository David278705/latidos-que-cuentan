# Latidos que Cuentan

**Latidos que Cuentan** es una aplicación móvil que permite a los usuarios monitorear su frecuencia cardíaca en tiempo real. Utiliza un dispositivo **ESP32** conectado a un sensor de frecuencia cardíaca **XD-58C** para recopilar los datos y los transmite de forma inalámbrica a través de **Bluetooth Low Energy (BLE)** a la aplicación desarrollada con **React Native usando Expo**.

## Descripción del Proyecto

El objetivo de este proyecto es proporcionar una herramienta sencilla y accesible para que cualquier persona pueda medir y visualizar su ritmo cardíaco en tiempo real desde su dispositivo móvil. La aplicación es ideal para quienes desean monitorear su salud, realizar seguimiento durante actividades físicas o simplemente entender mejor su bienestar cardíaco.

## Características

- **Monitoreo en Tiempo Real**: Visualiza instantáneamente tu frecuencia cardíaca en la aplicación.
- **Conexión Inalámbrica**: Utiliza Bluetooth Low Energy (BLE) para una comunicación eficiente y de bajo consumo energético.
- **Interfaz Intuitiva**: Diseño limpio y fácil de usar, centrado en mostrar la información esencial.
- **Compatibilidad Multiplataforma**: Funciona en dispositivos Android e iOS gracias a Expo.
- **Portabilidad**: El sensor XD-58C y el ESP32 son compactos, lo que permite llevarlos a cualquier lugar.

## Cómo Funciona

1. **Captura de Datos**: El sensor de frecuencia cardíaca **XD-58C** detecta los latidos del corazón del usuario.
2. **Procesamiento**: El **ESP32** recibe las señales del sensor y calcula los latidos por minuto (BPM).
3. **Transmisión**: El ESP32 envía el BPM a través de Bluetooth Low Energy (BLE).
4. **Visualización**: La aplicación móvil recibe los datos y los muestra en tiempo real en la pantalla.

## Uso de la Aplicación

- **Paso 1**: Enciende el dispositivo ESP32 con el sensor XD-58C conectado.
- **Paso 2**: Abre la aplicación "Latidos que Cuentan" en tu dispositivo móvil.
- **Paso 3**: La aplicación se conectará automáticamente al dispositivo y comenzará a mostrar tu frecuencia cardíaca.
- **Paso 4**: Observa tu ritmo cardíaco en tiempo real y monitorea cualquier cambio.

## Requisitos de Hardware

- **ESP32**: Un microcontrolador con capacidad de Bluetooth Low Energy.
- **Sensor XD-58C**: Sensor óptico de frecuencia cardíaca para medir los latidos del corazón.
- **Dispositivo Móvil**: Un teléfono inteligente o tableta con soporte para Bluetooth Low Energy y la capacidad de ejecutar aplicaciones Expo.

## Requisitos de Software

- **Aplicación Móvil**: "Latidos que Cuentan", desarrollada con React Native y Expo.
- **Expo Go**: Aplicación disponible en Google Play Store y Apple App Store para ejecutar aplicaciones Expo.

## Aplicaciones Potenciales

- **Deporte y Fitness**: Monitorea tu frecuencia cardíaca durante el ejercicio para optimizar tu entrenamiento.
- **Salud y Bienestar**: Realiza un seguimiento de tu ritmo cardíaco para detectar anomalías o controlar el estrés.
- **Educación**: Útil como herramienta didáctica en cursos de electrónica, programación o ciencias de la salud.
- **Investigación**: Puede ser utilizado en estudios que requieran el monitoreo continuo de la frecuencia cardíaca.

## Beneficios del Proyecto

- **Accesibilidad**: Ofrece una solución económica y fácil de implementar para el monitoreo cardíaco.
- **Personalización**: Al ser de código abierto, permite a otros desarrolladores adaptar y mejorar la aplicación según sus necesidades.
- **Comunidad**: Fomenta el aprendizaje y la colaboración entre entusiastas de la electrónica y la programación.

## Contribuciones y Agradecimientos

Este proyecto es posible gracias a la colaboración de desarrolladores y entusiastas que comparten la visión de hacer la tecnología de salud más accesible. Agradecemos a la comunidad de código abierto por su apoyo y recursos.

## Licencia

"Latidos que Cuentan" es un proyecto de código abierto bajo la **Licencia MIT**, lo que significa que eres libre de usar, modificar y distribuir el software con pocas restricciones.

---

**Nota**: Este proyecto no está destinado a uso médico profesional y no debe utilizarse como sustituto de equipos médicos certificados. Siempre consulta a un profesional de la salud para obtener asesoramiento médico.
