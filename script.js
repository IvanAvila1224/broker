// Conexión al broker MQTT utilizando WebSocket
const client = mqtt.connect('ws://localhost:8083/mqtt');
let luzEncendida = false;
let brilloActual = 0;

client.on('connect', () => {
    console.log('Conectado al broker');

    // Suscripción al tópico de encendido/apagado
    client.subscribe('domotica/luz/encendido', (err) => {
        if (err) {
            console.error('Error al suscribirse al topic de encendido/apagado:', err);
        } else {
            console.log('Suscripción exitosa al topic de encendido/apagado');
        }
    });

    // Suscripción al tópico de brillo
    client.subscribe('domotica/luz/brillo', (err) => {
        if (err) {
            console.error('Error al suscribirse al topic de brillo:', err);
        } else {
            console.log('Suscripción exitosa al topic de brillo');
        }
    });
});

client.on('message', (topic, message) => {
    console.log('Mensaje recibido en el topic', topic, ':', message.toString());

    if (topic === 'domotica/luz/encendido') {
        const estadoLuz = message.toString();
        luzEncendida = estadoLuz === 'encendido';
        console.log('La luz se encuentra:', estadoLuz);
    }

    if (topic === 'domotica/luz/brillo') {
        const nuevoBrillo = parseInt(message.toString());
        if (isNaN(nuevoBrillo)) {
            console.error('Valor de brillo inválido:', message.toString());
            return;
        }
        brilloActual = nuevoBrillo;
        console.log('El brillo actual es:', brilloActual);
        actualizarRangoBrillo();
    }
});
 
    client.subscribe('domotica/luz/color', (err) => {
    if (err) {
        console.error('Error al suscribirse al topic de color:', err);
    } else {
        console.log('Suscripción exitosa al topic de color');
    }
});


function encenderLuz() {
    if (luzEncendida) {
        console.log('La luz ya está encendida');
        return;
    }

    console.log('Encendiendo la luz');
    client.publish('domotica/luz/encendido', 'encendido');
}

function apagarLuz() {
    if (!luzEncendida) {
        console.log('La luz ya está apagada');
        return;
    }

    console.log('Apagando la luz');
    client.publish('domotica/luz/encendido', 'apagado');
}

function cambiarBrillo(valor) {
    if (!luzEncendida) {
        console.log('La luz está apagada. No se puede cambiar el brillo.');
        return;
    }

    brilloActual = parseInt(valor);
    console.log('Cambiando el brillo:', brilloActual);
    client.publish('domotica/luz/brillo', brilloActual.toString());
}

function actualizarRangoBrillo() {
    const rangoBrillo = document.getElementById('brilloRange');
    rangoBrillo.value = brilloActual.toString();
}

