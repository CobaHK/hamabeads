import React from 'react';
import { Pencil, Eraser, PaintBucket, Pipette, Square } from 'lucide-react';
import { Tool, ManufacturerPalettes } from './types';

export const TOOLS: { id: Tool; name: string }[] = [
  { id: Tool.Pencil, name: 'Pincel' },
  { id: Tool.Eraser, name: 'Borracha' },
  { id: Tool.Fill, name: 'Preencher' },
  { id: Tool.Eyedropper, name: 'Conta-gotas' },
  { id: Tool.Selection, name: 'Seleção' },
];

export const ToolIcons: { [key in Tool]: React.ReactNode } = {
  [Tool.Pencil]: <Pencil size={24} />,
  [Tool.Eraser]: <Eraser size={24} />,
  [Tool.Fill]: <PaintBucket size={24} />,
  [Tool.Eyedropper]: <Pipette size={24} />,
  [Tool.Selection]: <Square size={24} strokeDasharray="4 4" />,
};

export const PALETTES: ManufacturerPalettes = {
  Hama: [
    { name: 'Branco', code: '01', hex: '#FFFFFF' },
    { name: 'Creme', code: '02', hex: '#F2E9D4' },
    { name: 'Amarelo', code: '03', hex: '#FFD700' },
    { name: 'Laranja', code: '04', hex: '#FFA500' },
    { name: 'Vermelho', code: '05', hex: '#FF0000' },
    { name: 'Rosa', code: '06', hex: '#FFC0CB' },
    { name: 'Roxo', code: '07', hex: '#800080' },
    { name: 'Azul', code: '08', hex: '#0000FF' },
    { name: 'Azul Claro', code: '09', hex: '#ADD8E6' },
    { name: 'Verde', code: '10', hex: '#008000' },
    { name: 'Verde Claro', code: '11', hex: '#90EE90' },
    { name: 'Marrom', code: '12', hex: '#A52A2A' },
    { name: 'Cinza', code: '17', hex: '#808080' },
    { name: 'Preto', code: '18', hex: '#000000' },
  ],
  Perler: [
    { name: 'Branco', code: 'P01', hex: '#FDFEFE' },
    { name: 'Preto', code: 'P18', hex: '#1C1C1C' },
    { name: 'Vermelho', code: 'P05', hex: '#C51D22' },
    { name: 'Azul', code: 'P08', hex: '#1D53A0' },
  ],
  Artkal: [
    { name: 'Branco Neve', code: 'S01', hex: '#F4F4F4' },
    { name: 'Preto Forte', code: 'S17', hex: '#111111' },
  ],
};
