import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const dispositivo = 'bombaAgua';
const MQTTBroker = 'ws://localhost:8083/mqtt'; // Reemplaza con la URL de tu broker MQTT

const BombaAgua = ({ habitacion, id }) => {
  const [isOn, setIsOn] = useState(false);
  const [client, setClient] = useState(null);
  const [consumo, setConsumo] = useState(1000);
  const [llenadoInterval, setLlenadoInterval] = useState(null);
  const [inputConsumo, setInputConsumo] = useState('');

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTTBroker, {
      clientId: 'emqx_test',
      username: 'emqx_test',
      password: 'emqx_test',
    });

    mqttClient.on('connect', () => {
      setClient(mqttClient);
      mqttClient.subscribe(`hotel/habitación${habitacion}/bombaAgua${id}`);
    });

    mqttClient.on('message', (topic, message) => {
      const payload = JSON.parse(message.toString());
      setIsOn(payload.status === 'encendido');
    });

    return () => {
      if (client) {
        client.unsubscribe(`hotel/habitación${habitacion}/bombaAgua${id}`);
        client.end();
      }
    };
  }, [id]);

  const publishStatus = (status) => {
    if (client) {
      const payload = JSON.stringify({ habitacion, dispositivo, id, status });
      client.publish(`hotel/habitación${habitacion}/bombaAgua${id}`, payload);
    }
  };

  const turnOn = () => {
    if (!isOn) {
      publishStatus('encendido');
      detenerConsumo();
      realizarLlenado();
    }
  };

  const turnOff = () => {
    if (llenadoInterval) {
      console.log('Deteniendo el llenado de agua');
      detenerLlenado();
    }

    if (isOn) {
      publishStatus('apagado');
      setIsOn(false);
    }
  };

  const realizarLlenado = () => {
    console.log('Llenando agua');
    // Incremento del llenado de agua cada segundo
    const interval = setInterval(() => {
      setConsumo(prevConsumo => {
        const nuevoConsumo = prevConsumo + 5;
        if (nuevoConsumo >= consumo) {
         // console.log('El nivel de agua alcanzó su máximo');
          detenerLlenado();
          turnOff();
          setIsOn(false);
          return consumo;
        }
        return nuevoConsumo;
      });
    }, 1000);

    setLlenadoInterval(interval);
  };

  const detenerLlenado = () => {
    console.log('Llenado detenido');
    clearInterval(llenadoInterval);
    setLlenadoInterval(null);
  };

  const realizarConsumo = () => {
    console.log('Realizando consumo de agua');
    let prenderBomba = true; // Variable para controlar si se debe prender la bomba
    let bombaEncendida = false; // Variable para controlar si la bomba ya se ha encendido
  
    // Decremento del consumo de agua cada segundo
    const interval = setInterval(() => {
      setConsumo(prevConsumo => {
        const nuevoConsumo = prevConsumo - 5;
  
        if (nuevoConsumo <= 0) {
          console.log('Se ha consumido toda el agua');
          detenerConsumo();
          return 0;
        }
  
        if (nuevoConsumo <= consumo / 2 && !bombaEncendida) {
          console.log('¡Encender la bomba de agua ahora!');
          bombaEncendida = true;
        }
  
        if (nuevoConsumo <= consumo / 4 && bombaEncendida) {
          detenerConsumo();
          turnOn();
          setIsOn(true);
        }
  
        return nuevoConsumo;
      });
    }, 1000);
  
    setLlenadoInterval(interval);
  };
  
  const detenerConsumo = () => {
    console.log('Consumo detenido');
    clearInterval(llenadoInterval);
    setLlenadoInterval(null);
  };

  const handleConsumoChange = (event) => {
    setInputConsumo(event.target.value);
  };

  const handleGuardarClick = () => {
    const newConsumo = parseInt(inputConsumo);
    if (!isNaN(newConsumo)) {
      setConsumo(newConsumo);
      setInputConsumo('');
    }
  };

  return (
    <div>
      <h2>Bomba de Agua {id}</h2>
      <p>Estado: {isOn ? 'Encendida' : 'Apagada'}</p>
      <p>Consumo de Agua: {consumo}</p>
      <button onClick={turnOn} disabled={isOn || consumo >= consumo}>
        Encender
      </button>
      <button onClick={turnOff} disabled={!isOn}>
        Apagar
      </button>
      <button onClick={realizarConsumo} disabled={consumo <= 0}>
        Realizar Consumo de Agua
      </button>
      <br />
      <p>Agregue el nivel máximo de su tinaco:</p>
      <input
        type="number"
        value={inputConsumo}
        onChange={handleConsumoChange}
        disabled={isOn}
      />
      <button onClick={handleGuardarClick} disabled={isOn}>
        Guardar
      </button>
    </div>
  );
};

export default BombaAgua;