import React, { useRef, useEffect } from 'react';
import { ImageTraceState } from '../types';

interface Props {
    imageTrace: ImageTraceState;
    onUpdateImageTrace: (updates: Partial<ImageTraceState>) => void;
    style?: React.CSSProperties;
}

const ReferenceViewer: React.FC<Props> = ({ imageTrace, onUpdateImageTrace, style }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pointerRef = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
    const [isMinimized, setIsMinimized] = React.useState(false);
    const lastTouchDistance = useRef<number | null>(null);
    const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const currentScale = imageTrace.scale || 1;
            const delta = -e.deltaY; // invert so wheel up -> zoom in
            const scaleAmount = delta > 0 ? 1.08 : 1 / 1.08;
            const newScale = Math.min(Math.max(0.1, currentScale * scaleAmount), 10);

            // Calculate image point under cursor before and after scale to keep it stable
            const imgX = (mouseX - (rect.width / 2) - (imageTrace.x || 0)) / currentScale;
            const imgY = (mouseY - (rect.height / 2) - (imageTrace.y || 0)) / currentScale;

            const newX = mouseX - rect.width / 2 - imgX * newScale;
            const newY = mouseY - rect.height / 2 - imgY * newScale;

            onUpdateImageTrace({ scale: newScale, x: Math.round(newX), y: Math.round(newY) });
        };

        const onPointerDown = (ev: PointerEvent) => {
            // start pan
            (ev.target as Element).setPointerCapture(ev.pointerId);
            pointerRef.current = { id: ev.pointerId, startX: ev.clientX, startY: ev.clientY, origX: imageTrace.x || 0, origY: imageTrace.y || 0 };
        };

        const onPointerMove = (ev: PointerEvent) => {
            if (!pointerRef.current || pointerRef.current.id !== ev.pointerId) return;
            ev.preventDefault();
            const dx = ev.clientX - pointerRef.current.startX;
            const dy = ev.clientY - pointerRef.current.startY;
            onUpdateImageTrace({ x: pointerRef.current.origX + Math.round(dx), y: pointerRef.current.origY + Math.round(dy) });
        };

        const onPointerUp = (ev: PointerEvent) => {
            if (pointerRef.current && pointerRef.current.id === ev.pointerId) {
                try { (ev.target as Element).releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
                pointerRef.current = null;
            }
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('pointerdown', onPointerDown as any);
        window.addEventListener('pointermove', onPointerMove as any);
        window.addEventListener('pointerup', onPointerUp as any);

        return () => {
            el.removeEventListener('wheel', onWheel as any);
            el.removeEventListener('pointerdown', onPointerDown as any);
            window.removeEventListener('pointermove', onPointerMove as any);
            window.removeEventListener('pointerup', onPointerUp as any);
        };
    }, [imageTrace, onUpdateImageTrace]);

    const handleDoubleClick = () => {
        onUpdateImageTrace({ scale: 1, x: 0, y: 0 });
    };

    // Touch handlers for mobile pinch zoom
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isMinimized) return;

        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            lastTouchDistance.current = distance;
            lastTouchCenter.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (isMinimized) return;

        if (e.touches.length === 2 && lastTouchDistance.current && containerRef.current) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            const center = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };

            const rect = containerRef.current.getBoundingClientRect();

            // Calculate zoom
            const scale = distance / lastTouchDistance.current;
            const currentScale = imageTrace.scale || 1;
            const newScale = Math.min(Math.max(0.1, currentScale * scale), 10);

            // Calculate focal point for zoom
            const centerXInContainer = center.x - rect.left;
            const centerYInContainer = center.y - rect.top;

            const imgX = (centerXInContainer - rect.width / 2 - (imageTrace.x || 0)) / currentScale;
            const imgY = (centerYInContainer - rect.height / 2 - (imageTrace.y || 0)) / currentScale;

            const newX = centerXInContainer - rect.width / 2 - imgX * newScale;
            const newY = centerYInContainer - rect.height / 2 - imgY * newScale;

            onUpdateImageTrace({
                scale: newScale,
                x: Math.round(newX),
                y: Math.round(newY)
            });

            lastTouchDistance.current = distance;
            lastTouchCenter.current = center;
        }
    };

    const handleTouchEnd = () => {
        lastTouchDistance.current = null;
        lastTouchCenter.current = null;
    };

    return (
        <div
            ref={containerRef}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`${isMinimized ? 'md:w-[360px] md:max-h-[70vh]' : ''}`}
            style={{
                position: 'absolute',
                top: isMinimized ? 'auto' : '50%',
                bottom: isMinimized ? 20 : 'auto',
                left: isMinimized ? 20 : '50%',
                transform: isMinimized ? 'none' : 'translate(-50%, -50%)',
                width: isMinimized ? 80 : 'min(90vw, 400px)',
                height: isMinimized ? 80 : 'auto',
                maxHeight: isMinimized ? 80 : '70vh',
                overflow: 'hidden',
                padding: isMinimized ? 4 : 8,
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 8,
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                zIndex: 50,
                touchAction: 'none',
                transition: 'all 0.3s ease',
                ...style,
            }}
        >
            {/* Toggle button - visible on mobile */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                }}
                className="absolute md:hidden"
                style={{
                    pointerEvents: 'auto',
                    top: 4,
                    right: 4,
                    zIndex: 10,
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {isMinimized ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                )}
            </button>

            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isMinimized ? 0.7 : 1,
            }}>
                <img
                    src={imageTrace.src || undefined}
                    alt="Referência"
                    style={{
                        transform: `translate(${imageTrace.x || 0}px, ${imageTrace.y || 0}px) scale(${imageTrace.scale || 1})`,
                        transformOrigin: 'center center',
                        opacity: imageTrace.opacity ?? 1,
                        imageRendering: 'pixelated',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        userSelect: 'none',
                        pointerEvents: 'none', // interactions handled on container
                    }}
                />
            </div>
        </div>
    );
};

export default ReferenceViewer;
