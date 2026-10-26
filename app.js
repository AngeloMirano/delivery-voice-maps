// 1. Configuración inicial del Mapa
const map = L.map('map').setView([-11.8444, -76.3986], 15); // Vista inicial por defecto

// Cargar la capa gráfica del mapa (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let ubicacionActual = null;
let marcadores = {};

// Obtener datos guardados en el navegador
let clientes = JSON.parse(localStorage.getItem('delivery_clientes')) || [];

// 2. Obtener la ubicación GPS en tiempo real
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      ubicacionActual = { lat: latitude, lng: longitude };
      
      // Mostrar tu posición actual en el mapa
      L.circleMarker([latitude, longitude], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.8,
        radius: 8
      }).addTo(map).bindPopup("Estás aquí");
    },
    (err) => console.error("Error obteniendo GPS:", err),
    { enableHighAccuracy: true }
  );
}

// 3. Renderizar en el mapa todos los clientes guardados
function cargarClientesEnMapa() {
  clientes.forEach(cliente => {
    const marker = L.marker([cliente.lat, cliente.lng]).addTo(map);
    marker.bindPopup(`<b>${cliente.nombre}</b><br><button onclick="navegarA('${cliente.nombre}')">Ir aquí</button>`);
    marcadores[cliente.nombre.toLowerCase()] = cliente;
  });
}
cargarClientesEnMapa();

// 4. Función para abrir Google Maps con la ruta GPS
function navegarA(nombreCliente) {
  const cliente = marcadores[nombreCliente.toLowerCase()];
  if (cliente) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${cliente.lat},${cliente.lng}`;
    window.open(url, '_blank');
  } else {
    alert("Cliente no encontrado.");
  }
}

// 5. Configuración del Reconocimiento de Voz
const btnMic = document.getElementById('btn-mic');
const estado = document.getElementById('estado');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'es-PE'; // Español de Perú
  recognition.continuous = false;

  btnMic.addEventListener('click', () => {
    recognition.start();
    btnMic.classList.add('escuchando');
    estado.textContent = "Escuchando...";
  });

  recognition.onresult = (event) => {
    btnMic.classList.remove('escuchando');
    const texto = event.results[0][0].transcript.toLowerCase().trim();
    estado.textContent = `Escuchado: "${texto}"`;

    // COMANDO 1: GUARDAR UBICACIÓN (Ejemplo: "guarda esta ubicación Juan Perez")
    if (texto.includes('guarda esta ubicación') || texto.includes('guardar ubicación')) {
      if (!ubicacionActual) {
        alert("Aún no tenemos tu ubicación GPS precisa.");
        return;
      }

      // Extraer el nombre del cliente eliminando la frase clave
      let nombreCliente = texto
        .replace('guarda esta ubicación', '')
        .replace('guardar ubicación', '')
        .trim();

      if (!nombreCliente) {
        nombreCliente = prompt("¿Qué nombre le asignamos a este cliente?");
      }

      if (nombreCliente) {
        const nuevoCliente = {
          nombre: nombreCliente,
          lat: ubicacionActual.lat,
          lng: ubicacionActual.lng
        };

        clientes.push(nuevoCliente);
        localStorage.setItem('delivery_clientes', JSON.stringify(clientes));
        cargarClientesEnMapa();
        alert(`Ubicación guardada para: ${nombreCliente}`);
      }
    } 
    // COMANDO 2: IR A CLIENTE (Mencionando solo el nombre del cliente)
    else {
      const clienteEncontrado = clientes.find(c => texto.includes(c.nombre.toLowerCase()));
      if (clienteEncontrado) {
        estado.textContent = `Navegando hacia: ${clienteEncontrado.nombre}`;
        navegarA(clienteEncontrado.nombre);
      } else {
        estado.textContent = "Comando o cliente no reconocido. Intenta de nuevo.";
      }
    }
  };

  recognition.onerror = () => {
    btnMic.classList.remove('escuchando');
    estado.textContent = "Error al escuchar. Intenta de nuevo.";
  };

  recognition.onend = () => {
    btnMic.classList.remove('escuchando');
  };
} else {
  alert("Tu navegador no soporta reconocimiento de voz. Usa Google Chrome o Edge.");
}