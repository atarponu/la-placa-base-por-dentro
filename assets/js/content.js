/* =====================================================================
   CONTENT — todo el texto editable de los componentes
   ---------------------------------------------------------------------
   Formato por componente:
     name  · nombre
     what  · qué es (1 frase)
     does  · qué hace (1 frase)
     links · con qué se relaciona
     scene · id de la escena de detalle (para el botón "ver en detalle")
   ===================================================================== */
window.CONTENT = {
  parts: {
    socket: {
      name: 'Socket de CPU',
      what: 'La interfaz física y eléctrica entre el procesador y la placa.',
      does: 'Sujeta la CPU y lleva cientos de señales y alimentación a través de más de mil contactos.',
      links: ['CPU', 'VRM', 'RAM', 'PCIe'],
      scene: 'socket',
    },
    vrm: {
      name: 'VRM · regulación de voltaje',
      what: 'Módulo regulador formado por varias fases de alimentación.',
      does: 'Convierte los 12 V de la fuente en el voltaje bajo y estable que pide la CPU, al instante.',
      links: ['EPS 12 V', 'CPU'],
      scene: 'vrm',
    },
    eps: {
      name: 'Conector EPS 12 V',
      what: 'Conector de 8 pines (4+4) que llega directamente desde la fuente.',
      does: 'Alimenta el VRM de la CPU. Las placas de gama alta suelen añadir un segundo EPS.',
      links: ['Fuente (PSU)', 'VRM'],
      scene: 'energy',
    },
    atx24: {
      name: 'Conector ATX 24 pines',
      what: 'La alimentación principal de la placa: 12 V, 5 V, 3,3 V y 5 V de standby.',
      does: 'Alimenta chipset, ranuras, memoria, USB y la lógica que enciende el equipo.',
      links: ['Fuente (PSU)', 'toda la placa'],
      scene: 'energy',
    },
    dimm: {
      name: 'Ranuras DIMM',
      what: 'Zócalos para los módulos de memoria RAM (DDR4 o DDR5, nunca ambos).',
      does: 'Conectan la RAM al controlador de memoria que está dentro de la CPU.',
      links: ['RAM', 'CPU (controlador de memoria)'],
      scene: 'ram',
    },
    pcie1: {
      name: 'Ranura PCIe x16',
      what: 'La ranura principal de expansión, normalmente reforzada.',
      does: 'Conecta la tarjeta gráfica a las líneas PCIe que salen directamente de la CPU.',
      links: ['GPU', 'CPU'],
      scene: 'pcie',
    },
    pcieaux: {
      name: 'Ranuras PCIe x1 / x4',
      what: 'Ranuras secundarias. Una ranura puede ser x16 por fuera y x4 por dentro.',
      does: 'Aceptan tarjetas de red, captura, sonido o Wi-Fi; suelen colgar del chipset.',
      links: ['Chipset (PCH)', 'tarjetas de expansión'],
      scene: 'pcie',
    },
    m2: {
      name: 'Ranuras M.2',
      what: 'Conector compacto para SSD. M.2 es el formato, no la velocidad.',
      does: 'Con un SSD NVMe usa líneas PCIe. La primera suele ir a la CPU y el resto, al chipset.',
      links: ['CPU', 'Chipset', 'SSD NVMe / SATA'],
      scene: 'm2',
    },
    sata: {
      name: 'Puertos SATA',
      what: 'Interfaz de almacenamiento por cable, más antigua que NVMe.',
      does: 'Conecta discos duros, SSD de 2,5" y unidades ópticas a 6 Gb/s como máximo.',
      links: ['Chipset (PCH)', 'HDD · SSD'],
      scene: 'sata',
    },
    pch: {
      name: 'Chipset · PCH',
      what: 'El hub de entrada/salida de la plataforma.',
      does: 'Reparte USB, SATA, red, audio y líneas PCIe extra, y los comunica con la CPU por un único enlace.',
      links: ['CPU', 'USB', 'SATA', 'LAN', 'Audio'],
      scene: 'chipset',
    },
    bios: {
      name: 'Chip de firmware (BIOS / UEFI)',
      what: 'Memoria flash SPI no volátil.',
      does: 'Guarda el firmware UEFI que inicializa el hardware y arranca el sistema.',
      links: ['Chipset', 'CPU'],
      scene: 'uefi',
    },
    cmos: {
      name: 'Pila CMOS · RTC',
      what: 'Pila de litio de 3 V (normalmente una CR2032).',
      does: 'Mantiene en marcha el reloj (RTC), y según la placa algunos ajustes, cuando el PC está desenchufado.',
      links: ['RTC del chipset'],
      scene: 'cmos',
    },
    audio: {
      name: 'Audio integrado',
      what: 'Códec de audio con su zona de PCB aislada.',
      does: 'Convierte el audio digital en señal analógica para altavoces y micrófono.',
      links: ['Chipset (HD Audio)', 'panel trasero', 'F_AUDIO'],
      scene: 'io',
    },
    lan: {
      name: 'Controlador de red (LAN)',
      what: 'Chip Ethernet, por ejemplo de 1 o 2,5 Gb/s.',
      does: 'Conecta el equipo a la red por el puerto RJ45. Internamente usa una línea PCIe.',
      links: ['Chipset (PCIe)', 'puerto RJ45'],
      scene: 'io',
    },
    usbh: {
      name: 'Headers USB internos',
      what: 'Conectores de pines para los USB del frontal de la caja.',
      does: 'Los de 9 pines son USB 2.0 y los de 19/20 pines, USB 5 Gb/s; hay otro conector para USB-C frontal.',
      links: ['Chipset', 'frontal de la caja'],
      scene: 'headers',
    },
    fans: {
      name: 'Headers de ventilador',
      what: 'Conectores de 4 pines (PWM) para ventiladores y bombas.',
      does: 'Alimentan el ventilador, leen sus RPM y regulan su velocidad según la temperatura.',
      links: ['Ventiladores', 'firmware (curvas)'],
      scene: 'headers',
    },
    io: {
      name: 'Panel trasero · Rear I/O',
      what: 'Los conectores que ves en la parte trasera del PC.',
      does: 'USB, red, audio, antenas Wi-Fi y salidas de vídeo de la gráfica integrada.',
      links: ['Chipset', 'CPU', 'LAN', 'Audio'],
      scene: 'io',
    },
  },

  catNames: { cpu: 'CPU · PCIe', mem: 'Memoria', pwr: 'Energía', sto: 'Almacenamiento', io: 'I/O · Chipset', fw: 'Firmware' },
};
