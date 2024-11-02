import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import { useState, useEffect, useRef } from "react";
import { atob } from "react-native-quick-base64";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [history, setHistory] = useState([]);

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
          saveReading(bpmValue);
        });
      })
      .catch((error) => {
        console.log(error);
        setConnectionStatus("Error en la conexión");
      });
  };

  const saveReading = async (bpmValue) => {
    try {
      const timestamp = new Date().toISOString();
      const newEntry = { bpm: bpmValue, timestamp };
      const existingHistory = await AsyncStorage.getItem("bpmHistory");
      let historyArray = existingHistory ? JSON.parse(existingHistory) : [];
      historyArray.push(newEntry);
      await AsyncStorage.setItem("bpmHistory", JSON.stringify(historyArray));
    } catch (error) {
      console.error("Error al guardar el registro de BPM:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const existingHistory = await AsyncStorage.getItem("bpmHistory");
      let historyArray = existingHistory ? JSON.parse(existingHistory) : [];
      setHistory(historyArray);
    } catch (error) {
      console.error("Error al cargar el historial de BPM:", error);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      loadHistory();
    }
  }, [modalVisible]);

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

  // Función para obtener el mensaje y color según el BPM
  const getBPMStatus = (bpmValue) => {
    if (bpmValue < 60 && bpmValue > 30) {
      return { message: "Está algo bajo, contacte a su médico", color: "red" };
    } else if (bpmValue > 115) {
      return { message: "Riesgo de arritmia", color: "red" };
    } else if (bpmValue > 90) {
      return {
        message: "Tiene un PPM más elevado de lo normal",
        color: "orange",
      };
    } else if (bpmValue > 60 && bpmValue < 90) {
      return { message: "Corazón en buenas condiciones.", color: "green" };
    } else {
      return {
        message: "Usa el dispositivo para recibir el ultimo resultado",
        color: "white",
      };
    }
  };

  const bpmStatus = getBPMStatus(bpm);

  return (
    <View style={styles.container}>
      <View style={styles.topButtons}>
        <TouchableOpacity
          style={styles.openHistoryButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.openHistoryButtonText}>Abrir historial</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentWrapper}>
        <View style={styles.topTitle}>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Latidos que Cuentan</Text>
          </View>
        </View>
        <View style={styles.bpmWrapper}>
          <Text style={styles.bpmText}>{bpm} BPM</Text>
          <Text style={[styles.bpmStatusText, { color: bpmStatus.color }]}>
            {bpmStatus.message > 30 ? "Ultimo Resultado" : ""}{" "}
            {bpmStatus.message}
          </Text>
        </View>
      </View>
      <View style={styles.bottomWrapper}>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Historial de BPM</Text>
          <FlatList
            data={history}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              const itemStatus = getBPMStatus(item.bpm);
              return (
                <View
                  style={[
                    styles.historyItem,
                    { backgroundColor: itemStatus.color },
                  ]}
                >
                  <Text style={styles.historyText}>
                    {new Date(item.timestamp).toLocaleString()}: {item.bpm} BPM
                  </Text>
                </View>
              );
            }}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  topButtons: {
    marginTop: 50,
    width: "100%",
    alignItems: "center",
  },
  openHistoryButton: {
    backgroundColor: "#EF664C",
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
  },
  openHistoryButtonText: {
    color: "white",
    fontSize: 18,
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
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bpmText: {
    fontSize: 80,
    color: "#FFF386",
    fontWeight: "bold",
  },
  bpmStatusText: {
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
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
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#222",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  historyItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  historyText: {
    fontSize: 18,
    color: "white",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#EF664C",
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
  },
});
