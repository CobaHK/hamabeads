export interface Color {
  name: string;
  code: string;
  hex: string;
}

export type Palette = Color[];

export interface ManufacturerPalettes {
  [key: string]: Palette;
}

export enum Tool {
  Pencil = 'PENCIL',
  Eraser = 'ERASER',
  Fill = 'FILL',
  Eyedropper = 'EYEDROPPER',
  Selection = 'SELECTION',
}

export type GridColor = string | null;
export type Grid = GridColor[][];

export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  grid: Grid;
}

export interface BeadCount {
  [hex: string]: number;
}

export interface ImageTraceState {
  src: string | null;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  visible: boolean;
  // se true, a imagem de referência não é desenhada sobre a base, mas mostrada fora dela (p.ex. painel flutuante)
  outside?: boolean;
}

export interface ProjectListItem {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: any; // Firestore Timestamp
}

export interface ProjectData {
  name: string;
  thumbnail: string;
  gridWidth: number;
  gridHeight: number;
  layers: Layer[];
  customColors: Color[];
}
