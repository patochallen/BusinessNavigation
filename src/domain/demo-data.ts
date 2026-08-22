import type { Business, Category } from "./types";

export const businesses: Business[] = [
  {
    id: "valle-lumina",
    name: "Valle Lúmina",
    location: "Valle de Calamuchita, Córdoba",
    eyebrow: "Reserva de experiencias",
    description:
      "Un paisaje vivo para explorar a tu propio ritmo. Encontrá senderos, sabores y momentos que quedan.",
    mapOrigin: { latitude: -32.1342, longitude: -64.4801 },
    mapScaleMeters: 10,
    attractions: [
      {
        id: "mirador-norte",
        name: "Mirador Norte",
        category: "nature",
        description:
          "La vista más amplia del valle, al final del sendero de los molles.",
        position: { x: -4.2, z: -3.1 },
        color: "#e8b84a",
        tag: "Imperdible",
        eta: "8 min",
      },
      {
        id: "casa-del-fuego",
        name: "Casa del Fuego",
        category: "food",
        description:
          "Cocina de estación, pan de masa madre y café de especialidad.",
        position: { x: 2.4, z: -1.5 },
        color: "#e87952",
        tag: "Abierto ahora",
        eta: "4 min",
      },
      {
        id: "sendero-agua",
        name: "Sendero del Agua",
        category: "nature",
        description:
          "Un recorrido fresco junto al arroyo, con sombra durante todo el día.",
        position: { x: 4.5, z: 2.6 },
        color: "#56a9a0",
        tag: "Tranquilo",
        eta: "12 min",
      },
      {
        id: "tirolesa",
        name: "Tirolesa del Bosque",
        category: "adventure",
        description:
          "Cruza el bosque a 18 metros de altura. Turnos cada 30 minutos.",
        position: { x: -1.2, z: 3.8 },
        color: "#d878a6",
        tag: "Reserva previa",
        eta: "10 min",
      },
      {
        id: "punto-encuentro",
        name: "Punto de encuentro",
        category: "services",
        description: "Información, objetos perdidos y primeros auxilios.",
        position: { x: 0, z: 0 },
        color: "#6b8cbd",
        tag: "Servicios",
        eta: "2 min",
      },
    ],
  },
  {
    id: "puerto-azul",
    name: "Puerto Azul",
    location: "Mar del Plata, Buenos Aires",
    eyebrow: "Club costero",
    description: "Mar, deporte y cocina frente al horizonte.",
    mapOrigin: { latitude: -38.0055, longitude: -57.5426 },
    mapScaleMeters: 10,
    attractions: [],
  },
];

export const categoryLabels: Record<Category, string> = {
  food: "Sabores",
  adventure: "Aventura",
  services: "Servicios",
  nature: "Naturaleza",
};
