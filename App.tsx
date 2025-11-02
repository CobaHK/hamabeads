import React, { useState, useReducer, useCallback, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Layer, Tool, Grid, GridColor, Color, ManufacturerPalettes, ImageTraceState, ProjectListItem, ProjectData } from './types';
import { PALETTES } from './constants';
import ConfigModal from './components/ConfigModal';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Pegboard from './components/Pegboard';
import ReferenceViewer from './components/ReferenceViewer';
import DimensionDisplay from './components/DimensionDisplay';
import CountTooltip from './components/CountTooltip';
import { getUserProjects, saveProject, getProjectDetails, deleteProject } from './localStorageService';

type State = {
  gridWidth: number;
  gridHeight: number;
  layers: Layer[];
  activeLayerId: string;
  history: { layers: Layer[], activeLayerId: string }[];
  historyIndex: number;
};

type Action =
  | { type: 'INIT_GRID'; width: number; height: number }
  | { type: 'LOAD_PROJECT'; payload: { layers: Layer[], activeLayerId: string, gridWidth: number, gridHeight: number } }
  | { type: 'ADD_LAYER' }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'SELECT_LAYER'; id: string }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; id: string }
  | { type: 'REORDER_LAYERS', dragIndex: number; hoverIndex: number; }
  | { type: 'RENAME_LAYER', id: string; newName: string; }
  | { type: 'UPDATE_GRID'; grid: Grid; layerId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' };


const createEmptyGrid = (width: number, height: number): Grid =>
  Array.from({ length: height }, () => Array(width).fill(null));

const initialState: State = {
  gridWidth: 0,
  gridHeight: 0,
  layers: [],
  activeLayerId: '',
  history: [],
  historyIndex: -1,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INIT_GRID': {
      const newLayerId = `layer-${Date.now()}`;
      const newLayer: Layer = {
        id: newLayerId,
        name: 'Camada 1',
        isVisible: true,
        grid: createEmptyGrid(action.width, action.height),
      };
      const newState = {
        ...state,
        gridWidth: action.width,
        gridHeight: action.height,
        layers: [newLayer],
        activeLayerId: newLayerId
      };
      return { ...newState, history: [{ layers: newState.layers, activeLayerId: newState.activeLayerId }], historyIndex: 0 };
    }
    case 'LOAD_PROJECT': {
      const { layers, activeLayerId, gridWidth, gridHeight } = action.payload;
      const newState = {
        ...state,
        layers,
        activeLayerId,
        gridWidth,
        gridHeight,
      };
      return { ...newState, history: [{ layers, activeLayerId }], historyIndex: 0 };
    }
    case 'ADD_LAYER': {
      if (!state.gridWidth) return state;
      const newLayerId = `layer-${Date.now()}`;
      const newLayer: Layer = {
        id: newLayerId,
        name: `Camada ${state.layers.length + 1}`,
        isVisible: true,
        grid: createEmptyGrid(state.gridWidth, state.gridHeight),
      };
      const newLayers = [newLayer, ...state.layers];
      return { ...state, layers: newLayers, activeLayerId: newLayerId };
    }
    case 'DELETE_LAYER': {
      if (state.layers.length <= 1) return state;
      const newLayers = state.layers.filter(l => l.id !== action.id);
      const newActiveId = action.id === state.activeLayerId ? newLayers[0].id : state.activeLayerId;
      return { ...state, layers: newLayers, activeLayerId: newActiveId };
    }
    case 'SELECT_LAYER':
      return { ...state, activeLayerId: action.id };
    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        layers: state.layers.map(l => l.id === action.id ? { ...l, isVisible: !l.isVisible } : l)
      };
    case 'REORDER_LAYERS': {
      const { dragIndex, hoverIndex } = action;
      const newLayers = [...state.layers];
      const [draggedItem] = newLayers.splice(dragIndex, 1);
      newLayers.splice(hoverIndex, 0, draggedItem);
      return { ...state, layers: newLayers };
    }
    case 'RENAME_LAYER': {
      return {
        ...state,
        layers: state.layers.map(l => l.id === action.id ? { ...l, name: action.newName } : l)
      }
    }
    case 'UPDATE_GRID': {
      const newLayers = state.layers.map(l =>
        l.id === action.layerId ? { ...l, grid: action.grid } : l
      );
      const nextHistory = state.history.slice(0, state.historyIndex + 1);
      const newState = {
        ...state,
        layers: newLayers
      };
      nextHistory.push({ layers: newLayers, activeLayerId: state.activeLayerId });
      if (nextHistory.length > 50) nextHistory.shift();
      return { ...newState, history: nextHistory, historyIndex: nextHistory.length - 1 };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const pastState = state.history[newIndex];
      return { ...state, ...pastState, historyIndex: newIndex };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const futureState = state.history[newIndex];
      return { ...state, ...futureState, historyIndex: newIndex };
    }
    default:
      return state;
  }
};


const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.Pencil);
  const [currentColor, setCurrentColor] = useState<string>(PALETTES.Hama[0].hex);
  const [gridVisible, setGridVisible] = useState(true);
  const [selectionInfo, setSelectionInfo] = useState<{ count: number; x: number; y: number } | null>(null);
  const [customColors, setCustomColors] = useState<Color[]>([]);
  const [exportBackground, setExportBackground] = useState({ color: '#FFFFFF', transparent: false });
  const [imageTrace, setImageTrace] = useState<ImageTraceState>({ src: null, opacity: 0.5, x: 0, y: 0, scale: 1, visible: true });
  const [backgroundImage, setBackgroundImage] = useState<ImageTraceState>({ src: null, opacity: 1, x: 0, y: 0, scale: 1, visible: false });
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Novo Projeto');

  const userId = 'local-user'; // ID fixo para localStorage

  const fetchProjects = useCallback(() => {
    const userProjects = getUserProjects(userId);
    setProjects(userProjects);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const { gridWidth, gridHeight, layers, activeLayerId, history, historyIndex } = state;

  const allPalettes: ManufacturerPalettes = useMemo(() => {
    return { ...PALETTES, 'Personalizada': customColors, };
  }, [customColors]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageTrace({ src: e.target?.result as string, opacity: 0.5, x: 0, y: 0, scale: 1, visible: true });
    reader.readAsDataURL(file);
  };
  const updateImageTrace = (updates: Partial<ImageTraceState>) => setImageTrace(prev => ({ ...prev, ...updates }));

  const handleBackgroundUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setBackgroundImage({ src: e.target?.result as string, opacity: 1, x: 0, y: 0, scale: 1, visible: true });
    reader.readAsDataURL(file);
  };
  const updateBackgroundImage = (updates: Partial<ImageTraceState>) => setBackgroundImage(prev => ({ ...prev, ...updates }));

  const handleAddCustomColor = useCallback((hex: string) => {
    setCustomColors(prev => {
      const hexLower = hex.toLowerCase();
      const isDuplicate = Object.values(PALETTES).flat().some((c: Color) => c.hex.toLowerCase() === hexLower) || prev.some(c => c.hex.toLowerCase() === hexLower);
      if (isDuplicate) return prev;
      return [...prev, { hex, name: hex.toUpperCase(), code: `C${prev.length + 1}` }];
    });
  }, []);

  const drawingDimensions = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, hasBeads = false;
    layers.forEach(layer => {
      if (layer.isVisible) {
        layer.grid.forEach((row, y) => row.forEach((cell, x) => {
          if (cell) { hasBeads = true; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
        }));
      }
    });
    if (!hasBeads) return { width: 0, height: 0 };
    return { width: maxX - minX + 1, height: maxY - minY + 1 };
  }, [layers]);

  const beadCount = useMemo(() => {
    const counts: { [hex: string]: number } = {};
    layers.forEach(l => { if (l.isVisible) l.grid.forEach(r => r.forEach(c => { if (c) counts[c] = (counts[c] || 0) + 1; })); });
    return counts;
  }, [layers]);

  const allColors: Color[] = useMemo(() => Object.values(allPalettes).flat(), [allPalettes]);
  const getColorInfo = useCallback((hex: string) => allColors.find(c => c.hex.toLowerCase() === hex.toLowerCase()), [allColors]);

  const handleConfigConfirm = (width: number, height: number) => {
    dispatch({ type: 'INIT_GRID', width, height });
    setCurrentProjectId(null);
    setProjectName('Novo Projeto');
    setCustomColors([]);
    setIsProjectOpen(true);
    setIsConfiguring(false);
  };

  const updateGrid = useCallback((newGrid: Grid, layerId: string) => dispatch({ type: 'UPDATE_GRID', grid: newGrid, layerId }), []);

  const handleCellAction = useCallback((x: number, y: number, color: GridColor, tool: Tool) => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;

    if (tool === Tool.Eyedropper) {
      for (const layer of layers) { if (layer.isVisible && layer.grid[y][x]) { setCurrentColor(layer.grid[y][x]!); setCurrentTool(Tool.Pencil); return; } }
      return;
    }

    if (tool === Tool.Fill) {
      const { grid } = activeLayer, targetColor = grid[y][x];
      if (targetColor === color) return;
      const newGrid = grid.map(row => [...row]);
      const q: [number, number][] = [[x, y]];
      while (q.length > 0) {
        const [cx, cy] = q.shift()!;
        if (cx < 0 || cx >= gridWidth || cy < 0 || cy >= gridHeight || newGrid[cy][cx] !== targetColor) continue;
        newGrid[cy][cx] = color;
        q.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      updateGrid(newGrid, activeLayerId);
      return;
    }

    if (activeLayer.grid[y][x] === color) return;
    const newGrid = activeLayer.grid.map((r, ri) => ri === y ? r.map((c, ci) => (ci === x ? color : c)) : r);
    updateGrid(newGrid, activeLayerId);

  }, [activeLayerId, gridHeight, gridWidth, layers, updateGrid]);

  const handleSelectArea = useCallback((area, eventCoords) => {
    const [minX, maxX] = [Math.min(area.startX, area.endX), Math.max(area.startX, area.endX)];
    const [minY, maxY] = [Math.min(area.startY, area.endY), Math.max(area.startY, area.endY)];
    let count = 0;
    layers.forEach(l => { if (l.isVisible) { for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (l.grid[y]?.[x]) count++; } });
    if (count > 0) setSelectionInfo({ count, x: eventCoords.clientX, y: eventCoords.clientY });
    else setSelectionInfo(null);
  }, [layers]);

  const generateThumbnail = async (element: HTMLElement): Promise<string> => {
    const canvas = await html2canvas(element, { backgroundColor: null, scale: 0.2 });
    return canvas.toDataURL('image/png', 0.5);
  };

  const handleSaveProject = async () => {
    if (!isProjectOpen) return;
    const finalName = currentProjectId ? projectName : prompt("Digite o nome do projeto:", projectName);
    if (!finalName) return;

    const pegboardElement = document.getElementById('pegboard-export');
    if (!pegboardElement) return;

    const thumbnail = await generateThumbnail(pegboardElement);
    const projectData: ProjectData = { name: finalName, thumbnail, gridWidth, gridHeight, layers, customColors };
    const savedId = saveProject(userId, projectData, currentProjectId);

    setCurrentProjectId(savedId);
    setProjectName(finalName);
    fetchProjects();
    alert('Projeto salvo com sucesso!');
  };

  const handleLoadProject = (id: string) => {
    const projectData = getProjectDetails(id);
    if (projectData) {
      dispatch({ type: 'LOAD_PROJECT', payload: { ...projectData, activeLayerId: projectData.layers[0]?.id || '' } });
      setCurrentProjectId(id);
      setProjectName(projectData.name);
      setCustomColors(projectData.customColors || []);
      setIsProjectOpen(true);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
      deleteProject(id);
      if (id === currentProjectId) {
        setIsProjectOpen(false);
        setCurrentProjectId(null);
      }
      fetchProjects();
    }
  };

  const handleExportPNG = () => {
    const pegboardElement = document.getElementById('pegboard-export');
    if (pegboardElement) {
      const wasGridVisible = gridVisible;
      setGridVisible(true);
      setTimeout(() => {
        html2canvas(pegboardElement, { backgroundColor: null, scale: 2 }).then(canvas => {
          const finalCanvas = document.createElement('canvas'), ctx = finalCanvas.getContext('2d');
          if (!ctx) { const link = document.createElement('a'); link.download = 'hama-design.png'; link.href = canvas.toDataURL('image/png'); link.click(); return; }

          // Calcular informações
          const totalBeads = Object.values(beadCount).reduce((sum: number, count: number) => sum + count, 0);
          const colorsList = Object.entries(beadCount).sort(([, a], [, b]) => (b as number) - (a as number));
          const maxColorNameLength = Math.max(...colorsList.map(([hex]) => {
            const info = getColorInfo(hex);
            return info ? `${info.name} (${info.code})`.length : hex.length;
          }));

          // Calcular dimensões
          const padding = 20;
          const headerHeight = 80;
          const colorListHeight = colorsList.length > 0 ? (colorsList.length * 30 + 40) : 0;
          const sidebarWidth = 320;

          finalCanvas.width = canvas.width + padding * 3 + sidebarWidth;
          finalCanvas.height = Math.max(canvas.height + headerHeight + padding * 2, colorListHeight + headerHeight + padding * 2);

          const getContrastColor = (hex: string) => {
            if (hex.indexOf('#') === 0) hex = hex.slice(1);
            if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            if (hex.length !== 6) return '#111827';
            const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
            return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#111827' : '#f9fafb';
          };

          // Background
          if (!exportBackground.transparent) {
            ctx.fillStyle = exportBackground.color;
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          }

          const textColor = exportBackground.transparent ? (document.documentElement.classList.contains('dark') ? '#f9fafb' : '#111827') : getContrastColor(exportBackground.color);
          ctx.fillStyle = textColor;

          // Header - Dimensões e Total
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Largura: ${drawingDimensions.width} | Altura: ${drawingDimensions.height}`, padding, padding + 25);
          ctx.fillText(`Total de Hamas: ${totalBeads}`, padding, padding + 55);

          // Desenhar canvas da base
          ctx.drawImage(canvas, padding, padding + headerHeight);

          // Sidebar com lista de cores
          const sidebarX = canvas.width + padding * 2;
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('Lista de Cores:', sidebarX, padding + 25);

          ctx.font = '14px sans-serif';
          let yOffset = padding + 60;

          colorsList.forEach(([hex, count]) => {
            const colorInfo = getColorInfo(hex);
            const colorName = colorInfo ? `${colorInfo.name} (${colorInfo.code})` : hex;

            // Quadrado de cor
            ctx.fillStyle = hex;
            ctx.fillRect(sidebarX, yOffset - 12, 20, 20);
            ctx.strokeStyle = textColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(sidebarX, yOffset - 12, 20, 20);

            // Nome e quantidade
            ctx.fillStyle = textColor;
            ctx.textAlign = 'left';
            ctx.fillText(colorName, sidebarX + 28, yOffset + 4);
            ctx.textAlign = 'right';
            ctx.fillText(`${count}x`, sidebarX + sidebarWidth - 10, yOffset + 4);

            yOffset += 30;
          });

          const link = document.createElement('a');
          link.download = 'hama-design.png';
          link.href = finalCanvas.toDataURL('image/png');
          link.click();
        }).catch(err => console.error('Falha ao exportar PNG:', err)).finally(() => setGridVisible(wasGridVisible));
      }, 100);
    }
  };

  if (isConfiguring) return <ConfigModal onConfirm={handleConfigConfirm} />;

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {selectionInfo && <CountTooltip count={selectionInfo.count} x={selectionInfo.x} y={selectionInfo.y} />}
      <main className="flex flex-1 h-full relative" onClick={() => setSelectionInfo(null)}>
        {isProjectOpen ? (
          <>
            <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} onUndo={() => dispatch({ type: 'UNDO' })} onRedo={() => dispatch({ type: 'REDO' })} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} />
            <DimensionDisplay width={drawingDimensions.width} height={drawingDimensions.height} />
            <Pegboard layers={layers} activeLayerId={activeLayerId} gridWidth={gridWidth} gridHeight={gridHeight} currentTool={currentTool} currentColor={currentColor} onCellAction={handleCellAction} onSelectArea={handleSelectArea} gridVisible={gridVisible} imageTrace={imageTrace} backgroundImage={backgroundImage} />
            {/* Floating interactive reference viewer (wheel zoom + drag pan) */}
            {imageTrace.src && imageTrace.visible && imageTrace.outside && (
              <ReferenceViewer imageTrace={imageTrace} onUpdateImageTrace={updateImageTrace} />
            )}
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
            <div>
              <h2 className="text-2xl font-semibold">Bem-vindo ao Designer de Hama Beads</h2>
              <p className="mt-2">Selecione um projeto para carregar ou crie um novo na barra lateral.</p>
            </div>
          </div>
        )}
        <Sidebar
          isProjectOpen={isProjectOpen}
          currentColor={currentColor} setCurrentColor={setCurrentColor} layers={layers} activeLayerId={activeLayerId}
          onAddLayer={() => dispatch({ type: 'ADD_LAYER' })} onDeleteLayer={id => dispatch({ type: 'DELETE_LAYER', id })} onSelectLayer={id => dispatch({ type: 'SELECT_LAYER', id })}
          onToggleLayerVisibility={id => dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', id })} onReorderLayers={(d, h) => dispatch({ type: 'REORDER_LAYERS', dragIndex: d, hoverIndex: h })}
          onRenameLayer={(id, name) => dispatch({ type: 'RENAME_LAYER', id, newName: name })} onExportPNG={handleExportPNG} onToggleGrid={() => setGridVisible(v => !v)}
          gridVisible={gridVisible} allPalettes={allPalettes} onAddCustomColor={handleAddCustomColor} exportBackground={exportBackground} setExportBackground={setExportBackground}
          imageTrace={imageTrace} onImageUpload={handleImageUpload} onUpdateImageTrace={updateImageTrace}
          backgroundImage={backgroundImage} onBackgroundUpload={handleBackgroundUpload} onUpdateBackgroundImage={updateBackgroundImage}
          projects={projects} onNewProject={() => setIsConfiguring(true)} onLoadProject={handleLoadProject} onDeleteProject={handleDeleteProject} onSaveProject={handleSaveProject}
        />
      </main>
    </div>
  );
};

export default App;
