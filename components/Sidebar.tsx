import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Color, Layer, BeadCount, ManufacturerPalettes, ImageTraceState, ProjectListItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SidebarProps {
  isProjectOpen: boolean;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  layers: Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onReorderLayers: (dragIndex: number, hoverIndex: number) => void;
  onRenameLayer: (id: string, newName: string) => void;
  onExportPNG: () => void;
  onToggleGrid: () => void;
  gridVisible: boolean;
  allPalettes: ManufacturerPalettes;
  onAddCustomColor: (hex: string) => void;
  exportBackground: { color: string; transparent: boolean };
  setExportBackground: (bg: { color: string; transparent: boolean }) => void;
  imageTrace: ImageTraceState;
  backgroundImage?: ImageTraceState;
  onImageUpload: (file: File) => void;
  onBackgroundUpload?: (file: File) => void;
  onUpdateImageTrace: (updates: Partial<ImageTraceState>) => void;
  onUpdateBackgroundImage?: (updates: Partial<ImageTraceState>) => void;
  projects: ProjectListItem[];
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onSaveProject: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isProjectOpen,
  currentColor, setCurrentColor, layers, activeLayerId, onAddLayer, onDeleteLayer, onSelectLayer,
  onToggleLayerVisibility, onReorderLayers, onRenameLayer, onExportPNG, onToggleGrid, gridVisible, allPalettes,
  onAddCustomColor, exportBackground, setExportBackground, imageTrace, onImageUpload, onUpdateImageTrace,
  backgroundImage, onBackgroundUpload, onUpdateBackgroundImage,
  projects, onNewProject, onLoadProject, onDeleteProject, onSaveProject,
}) => {
  const [activeTab, setActiveTab] = useState(isProjectOpen ? 'design' : 'projects');
  const [selectedManufacturer, setSelectedManufacturer] = useState(Object.keys(allPalettes)[0]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isProjectOpen) setActiveTab('projects');
    else if (activeTab === 'projects') setActiveTab('design');
  }, [isProjectOpen]);

  useEffect(() => {
    if (editingLayerId && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editingLayerId]);

  useEffect(() => {
    if (!Object.keys(allPalettes).includes(selectedManufacturer)) setSelectedManufacturer(Object.keys(allPalettes)[0] || '');
  }, [allPalettes, selectedManufacturer]);

  const palette = allPalettes[selectedManufacturer] || [];

  const beadCount: BeadCount = useMemo(() => {
    const counts: BeadCount = {};
    layers.forEach(l => { if (l.isVisible) l.grid.forEach(r => r.forEach(c => { if (c) counts[c] = (counts[c] || 0) + 1; })); });
    return counts;
  }, [layers]);

  const allColors: Color[] = useMemo(() => Object.values(allPalettes).flat(), [allPalettes]);
  const getColorInfo = useCallback((hex: string) => allColors.find(c => c.hex.toLowerCase() === hex.toLowerCase()), [allColors]);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => { e.preventDefault(); if (draggedIndex === null || draggedIndex === index) return; onReorderLayers(draggedIndex, index); setDraggedIndex(index); };
  const handleDragEnd = () => setDraggedIndex(null);
  const handleRenameBlur = () => { if (editingLayerId && editingName.trim()) onRenameLayer(editingLayerId, editingName.trim()); setEditingLayerId(null); };
  const handleRenameKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleRenameBlur(); else if (e.key === 'Escape') setEditingLayerId(null); };

  const renderPalette = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Paleta</h3>
      <select value={selectedManufacturer} onChange={(e) => setSelectedManufacturer(e.target.value)} className="w-full p-2 mb-4 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-white">
        {Object.keys(allPalettes).map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <div className="grid grid-cols-5 gap-2 md:gap-2">
        {palette.map(c => (<div key={c.hex} className="flex flex-col items-center" title={`${c.name} (${c.code})`}><button onClick={() => setCurrentColor(c.hex)} className={`w-12 h-12 md:w-10 md:h-10 rounded-full border-2 transition-transform transform hover:scale-110 touch-manipulation ${currentColor.toLowerCase() === c.hex.toLowerCase() ? 'border-indigo-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.hex }} /></div>))}
      </div>
      {selectedManufacturer === 'Personalizada' && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Adicionar Cor</h4>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              onBlur={(e) => onAddCustomColor(e.target.value)}
              className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent"
              title="Selecione e adicione"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderLayers = () => (
    <div>
      <ul className="space-y-2">
        {layers.map((layer, index) => (
          <li key={layer.id} draggable={editingLayerId === null} onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} onClick={() => onSelectLayer(layer.id)} onDoubleClick={() => { setEditingLayerId(layer.id); setEditingName(layer.name); }} className={`flex items-center p-2 rounded cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <button onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(layer.id); }} className="mr-3 text-gray-500 hover:text-gray-800 dark:hover:text-white">{layer.isVisible ? <EyeIcon /> : <EyeOffIcon />}</button>
            {editingLayerId === layer.id ? (<input ref={inputRef} type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={handleRenameBlur} onKeyDown={handleRenameKeyDown} onClick={(e) => e.stopPropagation()} className="flex-grow bg-white dark:bg-gray-600 rounded px-1 border border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white" />) : (<span className="flex-grow text-sm truncate">{layer.name}</span>)}
            {layers.length > 1 && (<button onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }} className="ml-2 text-red-500 hover:text-red-700"><TrashIcon /></button>)}
          </li>
        ))}
      </ul>
      <button onClick={onAddLayer} className="mt-4 w-full py-2 md:py-2 text-base bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition touch-manipulation">Adicionar Camada</button>
    </div>
  );

  const renderImageTraceControls = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Imagem de Referência</h3>
      {!imageTrace.src ? (<><label htmlFor="image-upload" className="w-full text-center cursor-pointer py-2 bg-gray-500 text-white font-semibold rounded hover:bg-gray-600 transition block">Carregar Imagem</label><input id="image-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) onImageUpload(e.target.files[0]); e.target.value = ''; }} /></>) : (
        <div className="space-y-4">
          <div className="relative p-2 border rounded-md dark:border-gray-600"><img src={imageTrace.src} alt="Referência" className="max-w-full rounded" /><button onClick={() => onUpdateImageTrace({ src: null })} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 leading-none hover:bg-red-700" title="Remover Imagem"><TrashIcon /></button></div>
          <div className="flex items-center justify-between"><label htmlFor="trace-visible" className="text-sm font-medium">Visível</label><input type="checkbox" id="trace-visible" checked={imageTrace.visible} onChange={(e) => onUpdateImageTrace({ visible: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></div>
          <div className="flex items-center justify-between"><label htmlFor="trace-outside" className="text-sm font-medium">Mostrar fora da base</label><input type="checkbox" id="trace-outside" checked={!!imageTrace.outside} onChange={(e) => onUpdateImageTrace({ outside: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></div>
          <div><label htmlFor="trace-opacity" className="block text-sm font-medium">Opacidade: {Math.round(imageTrace.opacity * 100)}%</label><input type="range" id="trace-opacity" min="0" max="1" step="0.05" value={imageTrace.opacity} onChange={(e) => onUpdateImageTrace({ opacity: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /></div>
          <div><label htmlFor="trace-scale" className="block text-sm font-medium">Escala: {imageTrace.scale.toFixed(2)}x</label><input type="range" id="trace-scale" min="0.1" max="5" step="0.05" value={imageTrace.scale} onChange={(e) => onUpdateImageTrace({ scale: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label htmlFor="trace-x" className="block text-sm font-medium">Pos. X</label><input type="number" id="trace-x" value={imageTrace.x} onChange={(e) => onUpdateImageTrace({ x: parseInt(e.target.value, 10) || 0 })} className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm" /></div>
            <div><label htmlFor="trace-y" className="block text-sm font-medium">Pos. Y</label><input type="number" id="trace-y" value={imageTrace.y} onChange={(e) => onUpdateImageTrace({ y: parseInt(e.target.value, 10) || 0 })} className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm" /></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBackgroundImageControls = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Imagem de Background</h3>
      {!backgroundImage?.src ? (
        <>
          <label htmlFor="bg-upload" className="w-full text-center cursor-pointer py-2 bg-gray-500 text-white font-semibold rounded hover:bg-gray-600 transition block">Carregar Background</label>
          <input id="bg-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0] && onBackgroundUpload) onBackgroundUpload(e.target.files[0]); e.target.value = ''; }} />
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative p-2 border rounded-md dark:border-gray-600"><img src={backgroundImage.src} alt="Background" className="max-w-full rounded" /><button onClick={() => onUpdateBackgroundImage && onUpdateBackgroundImage({ src: null })} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 leading-none hover:bg-red-700" title="Remover Background"><TrashIcon /></button></div>
          <div className="flex items-center justify-between"><label htmlFor="bg-visible" className="text-sm font-medium">Visível</label><input type="checkbox" id="bg-visible" checked={backgroundImage.visible} onChange={(e) => onUpdateBackgroundImage && onUpdateBackgroundImage({ visible: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></div>
          <div><label htmlFor="bg-opacity" className="block text-sm font-medium">Opacidade: {Math.round((backgroundImage.opacity ?? 1) * 100)}%</label><input type="range" id="bg-opacity" min="0" max="1" step="0.05" value={backgroundImage.opacity ?? 1} onChange={(e) => onUpdateBackgroundImage && onUpdateBackgroundImage({ opacity: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /></div>
          <div><label htmlFor="bg-scale" className="block text-sm font-medium">Escala: {(backgroundImage.scale ?? 1).toFixed(2)}x</label><input type="range" id="bg-scale" min="0.1" max="5" step="0.05" value={backgroundImage.scale ?? 1} onChange={(e) => onUpdateBackgroundImage && onUpdateBackgroundImage({ scale: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label htmlFor="bg-x" className="block text-sm font-medium">Pos. X</label><input type="number" id="bg-x" value={backgroundImage.x} onChange={(e) => onUpdateBackgroundImage && onUpdateBackgroundImage({ x: parseInt(e.target.value, 10) || 0 })} className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm" /></div>
            <div><label htmlFor="bg-y" className="block text-sm font-medium">Pos. Y</label><input type="number" id="bg-y" value={backgroundImage.y} onChange={(e) => onUpdateBackgroundImage && onUpdateBackgroundImage({ y: parseInt(e.target.value, 10) || 0 })} className="w-full p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm" /></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBeadCount = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2">Contagem de Contas</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {Object.entries(beadCount).sort(([, a], [, b]) => b - a).map(([hex, count]) => {
          const colorInfo = getColorInfo(hex);
          return (<div key={hex} className="flex items-center justify-between text-sm"><div className="flex items-center"><div className="w-4 h-4 rounded-full mr-2 border border-gray-400" style={{ backgroundColor: hex }}></div><span className="truncate">{colorInfo ? `${colorInfo.name} ${colorInfo.code !== colorInfo.name ? `(${colorInfo.code})` : ''}` : hex}</span></div><span className="font-medium">{count}</span></div>);
        })}
        {Object.keys(beadCount).length === 0 && <p className="text-sm text-gray-500">Desenhe na base para ver a contagem.</p>}
      </div>
    </div>
  );

  const renderInfoAndExport = () => (
    <div>
      <h3 className="text-lg font-semibold mb-2">Ações</h3>
      <div className="space-y-3">
        <button onClick={onSaveProject} className="w-full py-2 md:py-2 text-base bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition touch-manipulation">Salvar Projeto</button>
        <div className="p-3 rounded-md border dark:border-gray-600">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fundo da Exportação</label>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2"><input type="color" id="export-bg-color" value={exportBackground.color} onChange={(e) => setExportBackground({ ...exportBackground, color: e.target.value })} disabled={exportBackground.transparent} className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed" /><span className="text-sm">{exportBackground.transparent ? 'Transparente' : exportBackground.color.toUpperCase()}</span></div>
            <div className="flex items-center"><input type="checkbox" id="export-bg-transparent" checked={exportBackground.transparent} onChange={(e) => setExportBackground({ ...exportBackground, transparent: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="export-bg-transparent" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Transparente</label></div>
          </div>
        </div>
        <button onClick={onToggleGrid} className="w-full py-2 md:py-2 text-base bg-gray-500 text-white font-semibold rounded hover:bg-gray-600 transition touch-manipulation">{gridVisible ? 'Ocultar' : 'Mostrar'} Grade</button>
        <button onClick={onExportPNG} className="w-full py-2 md:py-2 text-base bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition touch-manipulation">Exportar como PNG</button>
      </div>
    </div>
  );

  const renderProjectsBrowser = () => (
    <div>
      <button onClick={onNewProject} className="w-full mb-4 py-2 md:py-2 text-base bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition touch-manipulation">Novo Projeto</button>
      <h3 className="text-lg font-semibold mb-2">Meus Projetos</h3>
      <ul className="space-y-3">
        {projects.map(p => (
          <li key={p.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <img src={p.thumbnail} alt={`Thumbnail de ${p.name}`} className="w-16 h-16 rounded-md object-cover bg-gray-200 dark:bg-gray-600 border dark:border-gray-600" />
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate text-gray-800 dark:text-gray-200">{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {p.updatedAt ? `Atualizado ${formatDistanceToNow(p.updatedAt.toDate(), { addSuffix: true, locale: ptBR })}` : 'Recém-criado'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <button onClick={() => onLoadProject(p.id)} className="flex-1 py-2 text-sm bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition touch-manipulation">Carregar</button>
              <button onClick={() => onDeleteProject(p.id)} className="flex-1 py-2 text-sm bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition touch-manipulation">Excluir</button>
            </div>
          </li>
        ))}
        {projects.length === 0 && <p className="text-center text-sm text-gray-500 mt-4">Nenhum projeto salvo ainda. Clique em "Novo Projeto" para começar.</p>}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-4 right-4 z-30 bg-indigo-600 text-white p-4 rounded-full shadow-lg touch-manipulation"
        aria-label="Toggle Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative
        top-0 right-0 h-full
        w-80 max-w-[85vw]
        bg-white dark:bg-gray-800 text-gray-800 dark:text-white 
        shadow-lg flex flex-col 
        border-l dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        z-50 md:z-auto
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Fechar Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="border-b dark:border-gray-700 mt-10 md:mt-0">
          <nav className="flex -mb-px">
            <button onClick={() => setActiveTab('projects')} className={`flex-1 py-3 text-xs md:text-sm font-medium border-b-2 touch-manipulation ${activeTab === 'projects' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Projetos</button>
            <button onClick={() => setActiveTab('design')} disabled={!isProjectOpen} className={`flex-1 py-3 text-xs md:text-sm font-medium border-b-2 touch-manipulation ${activeTab === 'design' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>Design</button>
            <button onClick={() => setActiveTab('info')} disabled={!isProjectOpen} className={`flex-1 py-3 text-xs md:text-sm font-medium border-b-2 touch-manipulation ${activeTab === 'info' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>Informações</button>
          </nav>
        </div>
        <div className="p-4 flex-grow overflow-y-auto">
          {activeTab === 'projects' && renderProjectsBrowser()}
          {isProjectOpen && activeTab === 'design' && (
            <>
              {renderPalette()}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Camadas</h3>{renderLayers()}</div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">{renderBeadCount()}</div>
            </>
          )}
          {isProjectOpen && activeTab === 'info' && (
            <>
              {renderImageTraceControls()}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">{renderBackgroundImageControls()}</div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">{renderInfoAndExport()}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
};


const EyeIcon = () => <Eye size={20} />;
const EyeOffIcon = () => <EyeOff size={20} />;
const TrashIcon = () => <Trash2 size={20} />;

export default Sidebar;
