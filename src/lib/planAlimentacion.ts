export type ComidaPlan = {
  nombre: string;
  alimentos: string;
};

export type MenuPlan = {
  id: 1 | 2 | 3;
  nombre: string;
  descripcion: string;
  total: string;
  comidas: ComidaPlan[];
  preparacion: string[];
};

const desayuno = '2 huevos enteros + 2 claras, 20 g de Roquefort y 100 g de espinaca.';

export const MENUS_ALIMENTACION: MenuPlan[] = [
  {
    id: 1,
    nombre: 'Todo pechuga',
    descripcion: 'La opción más magra y alta en proteína.',
    total: '1.780-1.800 kcal · ~150 g proteína · ~155 g carbohidratos · ~70 g grasas',
    comidas: [
      { nombre: 'Desayuno', alimentos: desayuno },
      { nombre: 'Media mañana', alimentos: '80 g de pechuga, 150 g de brócoli y 50 g de palta.' },
      { nombre: 'Almuerzo', alimentos: '90 g de pechuga, 150 g de arroz, 200 g de brócoli y 50 g de palta.' },
      { nombre: 'Merienda', alimentos: '1 manzana grande (~180 g), 15 g de nueces, 1 huevo entero + 4 claras.' },
      { nombre: 'Cena', alimentos: '80 g de pechuga, 100 g de arroz, 200 g de brócoli y 50 g de palta.' },
    ],
    preparacion: ['250 g de pechuga cocida', '250 g de arroz cocido', '550 g de brócoli cocido', '3 huevos enteros + 6 claras'],
  },
  {
    id: 2,
    nombre: 'Todo pata-muslo',
    descripcion: 'Deshuesado y sin piel; ajusta las otras grasas del día.',
    total: '1.770-1.800 kcal · ~140 g proteína · ~150 g carbohidratos · ~70 g grasas',
    comidas: [
      { nombre: 'Desayuno', alimentos: desayuno },
      { nombre: 'Media mañana', alimentos: '100 g de pata-muslo, 150 g de brócoli y 30 g de palta.' },
      { nombre: 'Almuerzo', alimentos: '100 g de pata-muslo, 150 g de arroz, 200 g de brócoli y 25 g de palta.' },
      { nombre: 'Merienda', alimentos: '1 manzana grande (~180 g), 10 g de nueces y 4 claras.' },
      { nombre: 'Cena', alimentos: '100 g de pata-muslo, 100 g de arroz, 200 g de brócoli y 25 g de palta.' },
    ],
    preparacion: ['300 g de pata-muslo cocido', '250 g de arroz cocido', '550 g de brócoli cocido', '2 huevos enteros + 6 claras'],
  },
  {
    id: 3,
    nombre: 'Mixto',
    descripcion: 'Combina pechuga y pata-muslo durante el día.',
    total: '1.770-1.800 kcal · ~150 g proteína · ~150 g carbohidratos · ~65-70 g grasas',
    comidas: [
      { nombre: 'Desayuno', alimentos: desayuno },
      { nombre: 'Media mañana', alimentos: '75 g de pechuga, 150 g de brócoli y 35 g de palta.' },
      { nombre: 'Almuerzo', alimentos: '75 g de pata-muslo, 150 g de arroz, 200 g de brócoli y 35 g de palta.' },
      { nombre: 'Merienda', alimentos: '1 manzana grande (~180 g), 15 g de nueces y 4 claras.' },
      { nombre: 'Cena', alimentos: '75 g de pechuga + 75 g de pata-muslo, 100 g de arroz, 200 g de brócoli y 30 g de palta.' },
    ],
    preparacion: ['150 g de pechuga + 150 g de pata-muslo cocidos', '250 g de arroz cocido', '550 g de brócoli cocido', '2 huevos enteros + 6 claras'],
  },
];

export const GUIA_PESAJE = [
  'Pesá cocidos la pechuga, el pata-muslo, el arroz y el brócoli.',
  'Pesá como se comen la palta, la manzana, las nueces y el Roquefort.',
  'Una clara líquida equivale aproximadamente a 33-35 g/ml.',
];

export const VARIANTES_MERIENDA = [
  'Manzana: 180 g.',
  'Banana: 100-110 g en reemplazo de la manzana.',
  'Tortilla dulce: 4 claras (130-140 g/ml), edulcorante, canela o vainilla y fruta.',
  'Yogur proteico: opción ocasional con 15-17 g de proteína.',
];
