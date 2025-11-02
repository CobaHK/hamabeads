import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layer, GridColor, Tool, ImageTraceState } from '../types';

interface PegboardProps {
  layers: Layer[];
  activeLayerId: string;
  gridWidth: number;
  gridHeight: number;
  currentTool: Tool;
  currentColor: string;
  onCellAction: (x: number, y: number, color: GridColor, tool: Tool) => void;
  onSelectArea: (area: { startX: number; startY: number; endX: number; endY: number; }, eventCoords: { clientX: number, clientY: number }) => void;
  gridVisible: boolean;
  imageTrace: ImageTraceState;
  backgroundImage?: ImageTraceState;
}

const Pegboard: React.FC<PegboardProps> = ({
  layers,
  activeLayerId,
  gridWidth,
  gridHeight,
  currentTool,
  currentColor,
  onCellAction,
  onSelectArea,
  gridVisible,
  imageTrace,
  backgroundImage,
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [selectionArea, setSelectionArea] = useState<{ startX: number; startY: number; endX: number; endY: number; } | null>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);


  const getCellFromEvent = useCallback((e: React.MouseEvent<HTMLDivElement>): [number, number] | null => {
    if (!containerRef.current) return null;
    const containerRect = containerRef.current.getBoundingClientRect();
    const gridUntransformedWidth = gridWidth * 16;
    const gridUntransformedHeight = gridHeight * 16;

    const mouseXFromCenter = e.clientX - containerRect.left - containerRect.width / 2;
    const mouseYFromCenter = e.clientY - containerRect.top - containerRect.height / 2;

    const mouseXOnGrid = (mouseXFromCenter - pan.x) / zoom;
    const mouseYOnGrid = (mouseYFromCenter - pan.y) / zoom;

    const mouseXFromTopLeft = mouseXOnGrid + gridUntransformedWidth / 2;
    const mouseYFromTopLeft = mouseYOnGrid + gridUntransformedHeight / 2;

    const x = Math.floor(mouseXFromTopLeft / 16);
    const y = Math.floor(mouseYFromTopLeft / 16);

    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      return [x, y];
    }
    return null;
  }, [gridWidth, gridHeight, pan.x, pan.y, zoom]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 1 || e.ctrlKey) { // Middle mouse button or Ctrl+Click for panning
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    setIsMouseDown(true);
    if (currentTool === Tool.Selection) {
      const coords = getCellFromEvent(e);
      if (coords) {
        setSelectionArea({ startX: coords[0], startY: coords[1], endX: coords[0], endY: coords[1] });
      }
    } else {
      const coords = getCellFromEvent(e);
      if (coords) {
        const color = currentTool === Tool.Eraser ? null : currentColor;
        onCellAction(coords[0], coords[1], color, currentTool);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isMouseDown) return;

    if (currentTool === Tool.Selection) {
      if (selectionArea) {
        const coords = getCellFromEvent(e);
        if (coords) {
          setSelectionArea(prev => ({ ...prev!, endX: coords[0], endY: coords[1] }));
        }
      }
    } else if (currentTool === Tool.Pencil || currentTool === Tool.Eraser) {
      const coords = getCellFromEvent(e);
      if (coords) {
        const color = currentTool === Tool.Eraser ? null : currentColor;
        onCellAction(coords[0], coords[1], color, Tool.Pencil); // Force pencil for drag
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (currentTool === Tool.Selection && selectionArea) {
      onSelectArea(selectionArea, { clientX: e.clientX, clientY: e.clientY });
      setSelectionArea(null);
    }
    setIsMouseDown(false);
    setIsPanning(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(0.1, zoom + scaleAmount), 10);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseXFromCenter = e.clientX - rect.left - rect.width / 2;
      const mouseYFromCenter = e.clientY - rect.top - rect.height / 2;
      const pointX = (mouseXFromCenter - pan.x) / zoom;
      const pointY = (mouseYFromCenter - pan.y) / zoom;
      const newPanX = mouseXFromCenter - pointX * newZoom;
      const newPanY = mouseYFromCenter - pointY * newZoom;
      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      }
    }
  }, [zoom, pan.x, pan.y]);

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    switch (currentTool) {
      case Tool.Pencil: return 'crosshair';
      case Tool.Eraser: return 'cell';
      case Tool.Fill: return 'copy';
      case Tool.Eyedropper: return 'pointer';
      case Tool.Selection: return 'cell';
      default: return 'default';
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two finger pinch/pan
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      lastTouchDistance.current = distance;
      lastTouchCenter.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      // Single finger draw/pan
      const touch = e.touches[0];
      const coords = getCellFromEvent({ clientX: touch.clientX, clientY: touch.clientY } as any);
      if (coords && (currentTool === Tool.Pencil || currentTool === Tool.Eraser)) {
        setIsMouseDown(true);
        const color = currentTool === Tool.Eraser ? null : currentColor;
        onCellAction(coords[0], coords[1], color, currentTool);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch zoom + pan
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      if (lastTouchDistance.current && lastTouchCenter.current && containerRef.current) {
        // Zoom
        const scale = distance / lastTouchDistance.current;
        const newZoom = Math.min(Math.max(0.1, zoom * scale), 10);

        // Pan
        const rect = containerRef.current.getBoundingClientRect();
        const centerXFromCenter = center.x - rect.left - rect.width / 2;
        const centerYFromCenter = center.y - rect.top - rect.height / 2;
        const pointX = (centerXFromCenter - pan.x) / zoom;
        const pointY = (centerYFromCenter - pan.y) / zoom;
        const newPanX = centerXFromCenter - pointX * newZoom;
        const newPanY = centerYFromCenter - pointY * newZoom;

        setPan({ x: newPanX, y: newPanY });
        setZoom(newZoom);
        lastTouchDistance.current = distance;
        lastTouchCenter.current = center;
      }
    } else if (e.touches.length === 1 && isMouseDown) {
      // Continue drawing
      const touch = e.touches[0];
      const coords = getCellFromEvent({ clientX: touch.clientX, clientY: touch.clientY } as any);
      if (coords && (currentTool === Tool.Pencil || currentTool === Tool.Eraser)) {
        const color = currentTool === Tool.Eraser ? null : currentColor;
        onCellAction(coords[0], coords[1], color, Tool.Pencil);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsMouseDown(false);
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  };


  return (
    <div
      ref={containerRef}
      className="pegboard-container flex-grow h-full w-full bg-gray-200 dark:bg-gray-900 overflow-hidden flex items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: getCursor() }}
    >
      <div
        ref={gridRef}
        id="pegboard-export"
        className="relative bg-gray-300 dark:bg-gray-700 shadow-lg"
        style={{
          width: `${gridWidth * 16}px`,
          height: `${gridHeight * 16}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          imageRendering: 'pixelated',
        }}
      >
        {/* Background image (render abaixo das camadas) */}
        {backgroundImage?.src && backgroundImage.visible && (
          <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${gridWidth * 16}px`,
              height: `${gridHeight * 16}px`,
              backgroundImage: `url(${backgroundImage.src})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              opacity: backgroundImage.opacity,
              imageRendering: 'pixelated',
              transform: `translate(${backgroundImage.x}px, ${backgroundImage.y}px) scale(${backgroundImage.scale})`,
              transformOrigin: 'center center',
            }}
          />
        )}

        {/* Image trace overlay (only if not flagged as outside) */}
        {imageTrace.src && imageTrace.visible && !imageTrace.outside && (
          <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${gridWidth * 16}px`,
              height: `${gridHeight * 16}px`,
              backgroundImage: `url(${imageTrace.src})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              opacity: imageTrace.opacity,
              imageRendering: 'pixelated',
              transform: `translate(${imageTrace.x}px, ${imageTrace.y}px) scale(${imageTrace.scale})`,
              transformOrigin: 'center center',
            }}
          />
        )}
        {layers.map(layer =>
          layer.isVisible && (
            <div
              key={layer.id}
              className="absolute top-0 left-0 grid"
              style={{
                width: '100%',
                height: '100%',
                gridTemplateColumns: `repeat(${gridWidth}, 16px)`,
                gridTemplateRows: `repeat(${gridHeight}, 16px)`,
                opacity: activeLayerId === layer.id ? 1 : 0.6,
                pointerEvents: 'none',
              }}
            >
              {layer.grid.flat().map((color, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: color || 'transparent',
                    boxShadow: color ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 0 1px rgba(0, 0, 0, 0.2)' : 'none'
                  }}
                />
              ))}
            </div>
          )
        )}
        {selectionArea && (
          <div className="absolute top-0 left-0 pointer-events-none" style={{
            left: `${Math.min(selectionArea.startX, selectionArea.endX) * 16}px`,
            top: `${Math.min(selectionArea.startY, selectionArea.endY) * 16}px`,
            width: `${(Math.abs(selectionArea.endX - selectionArea.startX) + 1) * 16}px`,
            height: `${(Math.abs(selectionArea.endY - selectionArea.startY) + 1) * 16}px`,
            backgroundColor: 'rgba(99, 102, 241, 0.3)',
            border: '1px solid rgba(99, 102, 241, 0.8)',
          }} />
        )}
        {gridVisible && (
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              backgroundSize: `${16}px ${16}px`,
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(Pegboard);