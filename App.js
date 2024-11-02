import { StyleSheet, Text, View, PermissionsAndroid } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { useState, useEffect, useRef } from "react";
import { atob } from "react-native-quick-base64";

const bleManager = new BleManager();

// Permiso de Bluetooth para Android
async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      {
        title: "Permiso de ubicación para escaneo Bluetooth",
        message:
          "Concede permiso de ubicación para permitir que la aplicación escanee dispositivos Bluetooth",
        buttonNeutral: "Preguntar más tarde",
        buttonNegative: "Cancelar",
        buttonPositive: "OK",
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Permiso de ubicación para escaneo Bluetooth concedido");
    } else {
      console.log("Permiso de ubicación para escaneo Bluetooth denegado");
    }
  } catch (err) {
    console.warn(err);
  }
}

requestLocationPermission();

const SERVICE_UUID = "91bad492-b950-4226-aa2b-4ede9fa42f59";
const CHARACTERISTIC_UUID = "cba1d466-344c-4be3-ab3f-189f80dd7518";

export default function App() {
  const [deviceID, setDeviceID] = useState(null);
  const [bpm, setBpm] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Buscando...");

  const deviceRef = useRef(null);

  const searchAndConnectToDevice = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setConnectionStatus("Error al buscar dispositivos");
        return;
      }
      if (device.name === "Latidos que Cuentan") {
        bleManager.stopDeviceScan();
        setConnectionStatus("Conectando...");
        connectToDevice(device);
      }
    });
  };

  useEffect(() => {
    searchAndConnectToDevice();
  }, []);

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus("Conectado");
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        return device.services();
      })
      .then((services) => {
        let service = services.find((service) => service.uuid === SERVICE_UUID);
        return service.characteristics();
      })
      .then((characteristics) => {
        let bpmCharacteristic = characteristics.find(
          (char) => char.uuid === CHARACTERISTIC_UUID
        );
        bpmCharacteristic.monitor((error, char) => {
          if (error) {
            console.error(error);
            return;
          }
          const rawBpmData = atob(char.value);
          console.log("Datos de BPM recibidos:", rawBpmData);
          const bpmValue = parseInt(rawBpmData, 10);
          setBpm(bpmValue);
        });
      })
      .catch((error) => {
        console.log(error);
        setConnectionStatus("Error en la conexión");
      });
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.log("Desconectado con error:", error);
        }
        setConnectionStatus("Desconectado");
        console.log("Dispositivo desconectado");
        setBpm(0); // Reiniciar el BPM
        if (deviceRef.current) {
          setConnectionStatus("Reconectando...");
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus("Conectado"))
            .catch((error) => {
              console.log("Reconexión fallida: ", error);
              setConnectionStatus("Reconexión fallida");
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.topTitle}>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Latidos que Cuentan</Text>
          </View>
        </View>
        <View style={styles.bpmWrapper}>
          <Text style={styles.bpmText}>{bpm} BPM</Text>
        </View>
      </View>
      <View style={styles.bottomWrapper}>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  topTitle: {
    paddingVertical: 20,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EF664C",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    color: "white",
  },
  bpmWrapper: {
    marginTop: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  bpmText: {
    fontSize: 80,
    color: "#FFF386",
    fontWeight: "bold",
  },
  bottomWrapper: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EF664C",
    marginBottom: 20,
    height: "10%",
    borderRadius: 20,
    width: "90%",
  },
  connectionStatus: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
});
