import React, { useState, useRef, useEffect } from 'react';

// Room configurations with realistic room images (using gradients as fallback)
const ROOM_PRESETS = [
  {
    id: 'living-modern',
    name: 'Modern Living Room',
    wallColor: '#F5F5F0',
    bgGradient: 'linear-gradient(180deg, #F5F5F0 0%, #E8E4DC 60%, #8B7355 60%, #8B7355 100%)',
    artworkPosition: { x: 50, y: 35 },
    defaultScale: 0.35,
    furniture: 'sofa',
  },
  {
    id: 'living-classic',
    name: 'Classic Living Room',
    wallColor: '#E8DFD0',
    bgGradient: 'linear-gradient(180deg, #E8DFD0 0%, #D4C4B0 60%, #6B4423 60%, #6B4423 100%)',
    artworkPosition: { x: 50, y: 35 },
    defaultScale: 0.4,
    furniture: 'fireplace',
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    wallColor: '#F0EBE3',
    bgGradient: 'linear-gradient(180deg, #F0EBE3 0%, #E5DED3 55%, #C4B8A5 55%, #C4B8A5 100%)',
    artworkPosition: { x: 50, y: 30 },
    defaultScale: 0.3,
    furniture: 'bed',
  },
  {
    id: 'office',
    name: 'Home Office',
    wallColor: '#E5E5E5',
    bgGradient: 'linear-gradient(180deg, #E5E5E5 0%, #D9D9D9 65%, #4A4A4A 65%, #4A4A4A 100%)',
    artworkPosition: { x: 50, y: 35 },
    defaultScale: 0.25,
    furniture: 'desk',
  },
  {
    id: 'dining',
    name: 'Dining Room',
    wallColor: '#F8F4ED',
    bgGradient: 'linear-gradient(180deg, #F8F4ED 0%, #EDE5D8 60%, #5C4033 60%, #5C4033 100%)',
    artworkPosition: { x: 50, y: 32 },
    defaultScale: 0.35,
    furniture: 'table',
  },
  {
    id: 'hallway',
    name: 'Hallway',
    wallColor: '#FAFAFA',
    bgGradient: 'linear-gradient(180deg, #FAFAFA 0%, #F0F0F0 70%, #3D3D3D 70%, #3D3D3D 100%)',
    artworkPosition: { x: 50, y: 40 },
    defaultScale: 0.4,
    furniture: 'console',
  },
];

// Wall color options
const WALL_COLORS = [
  { id: 'white', name: 'White', color: '#FFFFFF' },
  { id: 'cream', name: 'Cream', color: '#F5F5DC' },
  { id: 'beige', name: 'Beige', color: '#E8DFD0' },
  { id: 'gray', name: 'Light Gray', color: '#E5E5E5' },
  { id: 'sage', name: 'Sage Green', color: '#D4E2D4' },
  { id: 'blue', name: 'Soft Blue', color: '#D4E5F7' },
  { id: 'blush', name: 'Blush Pink', color: '#F5E1E1' },
  { id: 'charcoal', name: 'Charcoal', color: '#4A4A4A' },
  { id: 'navy', name: 'Navy Blue', color: '#2C3E50' },
  { id: 'forest', name: 'Forest Green', color: '#2D4A3E' },
];

// Furniture SVG components
const FurnitureSVG = ({ type, className }) => {
  switch (type) {
    case 'sofa':
      return (
        <svg viewBox="0 0 400 120" className={className}>
          {/* Modern Sofa */}
          <rect x="10" y="40" width="380" height="70" rx="8" fill="#6B7280" />
          <rect x="20" y="20" width="360" height="50" rx="6" fill="#9CA3AF" />
          <rect x="5" y="100" width="30" height="15" rx="3" fill="#4B5563" />
          <rect x="365" y="100" width="30" height="15" rx="3" fill="#4B5563" />
          {/* Cushions */}
          <rect x="30" y="25" width="100" height="40" rx="4" fill="#D1D5DB" />
          <rect x="150" y="25" width="100" height="40" rx="4" fill="#D1D5DB" />
          <rect x="270" y="25" width="100" height="40" rx="4" fill="#D1D5DB" />
        </svg>
      );
    case 'fireplace':
      return (
        <svg viewBox="0 0 300 150" className={className}>
          {/* Fireplace mantel */}
          <rect x="0" y="0" width="300" height="20" rx="2" fill="#8B4513" />
          <rect x="10" y="20" width="280" height="130" fill="#2D2D2D" />
          <rect x="25" y="35" width="250" height="100" fill="#1A1A1A" />
          {/* Fire glow */}
          <ellipse cx="150" cy="110" rx="60" ry="25" fill="#FF6B35" opacity="0.6" />
          <ellipse cx="150" cy="105" rx="40" ry="20" fill="#FF8C42" opacity="0.8" />
        </svg>
      );
    case 'bed':
      return (
        <svg viewBox="0 0 400 100" className={className}>
          {/* Headboard */}
          <rect x="0" y="0" width="400" height="60" rx="4" fill="#8B7355" />
          {/* Bed frame */}
          <rect x="0" y="55" width="400" height="40" rx="2" fill="#A0927D" />
          {/* Pillows */}
          <rect x="20" y="60" width="80" height="25" rx="12" fill="#F5F5F5" />
          <rect x="120" y="60" width="80" height="25" rx="12" fill="#F5F5F5" />
          <rect x="300" y="60" width="80" height="25" rx="12" fill="#F5F5F5" />
          <rect x="200" y="60" width="80" height="25" rx="12" fill="#F5F5F5" />
        </svg>
      );
    case 'desk':
      return (
        <svg viewBox="0 0 350 100" className={className}>
          {/* Desk surface */}
          <rect x="0" y="0" width="350" height="10" rx="2" fill="#5C4033" />
          {/* Desk legs */}
          <rect x="10" y="10" width="15" height="85" fill="#4A3728" />
          <rect x="325" y="10" width="15" height="85" fill="#4A3728" />
          {/* Monitor */}
          <rect x="130" y="-60" width="90" height="55" rx="2" fill="#2D2D2D" />
          <rect x="165" y="-5" width="20" height="10" fill="#3D3D3D" />
          {/* Keyboard */}
          <rect x="120" y="0" width="110" height="8" rx="1" fill="#4A4A4A" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 400 80" className={className}>
          {/* Table surface */}
          <ellipse cx="200" cy="10" rx="180" ry="20" fill="#6B4423" />
          {/* Table leg */}
          <rect x="185" y="20" width="30" height="55" fill="#5C3A1D" />
          <ellipse cx="200" cy="75" rx="50" ry="8" fill="#4A2F17" />
        </svg>
      );
    case 'console':
      return (
        <svg viewBox="0 0 300 60" className={className}>
          {/* Console table */}
          <rect x="0" y="0" width="300" height="8" rx="2" fill="#5C4033" />
          <rect x="10" y="8" width="8" height="50" fill="#4A3728" />
          <rect x="282" y="8" width="8" height="50" fill="#4A3728" />
          {/* Decorative vase */}
          <ellipse cx="150" cy="-10" rx="15" ry="20" fill="#9CA3AF" />
        </svg>
      );
    default:
      return null;
  }
};

export default function VirtualRoomPreview({ artwork, isOpen, onClose }) {
  const [selectedRoom, setSelectedRoom] = useState(ROOM_PRESETS[0]);
  const [customWallColor, setCustomWallColor] = useState(null);
  const [artworkScale, setArtworkScale] = useState(ROOM_PRESETS[0].defaultScale);
  const [artworkPosition, setArtworkPosition] = useState(ROOM_PRESETS[0].artworkPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [showFrame, setShowFrame] = useState(true);
  const [frameStyle, setFrameStyle] = useState('modern');
  const containerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const artworkImage = artwork?.images?.[0] || artwork?.image;

  useEffect(() => {
    if (selectedRoom) {
      setArtworkScale(selectedRoom.defaultScale);
      setArtworkPosition(selectedRoom.artworkPosition);
    }
  }, [selectedRoom]);

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setCustomWallColor(null);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.artwork-preview')) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - (artworkPosition.x * containerRef.current.offsetWidth / 100),
        y: e.clientY - (artworkPosition.y * containerRef.current.offsetHeight / 100),
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = ((e.clientX - dragStartPos.current.x) / containerRect.width) * 100;
      const newY = ((e.clientY - dragStartPos.current.y) / containerRect.height) * 100;
      
      setArtworkPosition({
        x: Math.max(10, Math.min(90, newX)),
        y: Math.max(5, Math.min(55, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getFrameStyle = () => {
    switch (frameStyle) {
      case 'modern':
        return 'border-4 border-gray-800';
      case 'classic':
        return 'border-8 border-amber-700 shadow-lg';
      case 'minimal':
        return 'border-2 border-gray-300';
      case 'ornate':
        return 'border-[12px] border-amber-600 shadow-xl';
      case 'float':
        return 'shadow-2xl';
      default:
        return 'border-4 border-gray-800';
    }
  };

  const getCurrentWallColor = () => {
    return customWallColor || selectedRoom.wallColor;
  };

  const getRoomBackground = () => {
    if (customWallColor) {
      // Create gradient with custom wall color
      const floorColor = selectedRoom.bgGradient.match(/#[0-9A-Fa-f]{6}(?=[^#]*$)/)?.[0] || '#8B7355';
      return `linear-gradient(180deg, ${customWallColor} 0%, ${customWallColor} 60%, ${floorColor} 60%, ${floorColor} 100%)`;
    }
    return selectedRoom.bgGradient;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" data-testid="virtual-room-preview">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🏠</span> Virtual Room Preview
            </h2>
            <p className="text-sm text-gray-500">See how "{artwork?.title}" looks in different settings</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            data-testid="close-room-preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 p-4 bg-gray-100">
            <div
              ref={containerRef}
              className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-2xl cursor-crosshair"
              style={{ background: getRoomBackground() }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Room elements - decorative shadows/lighting */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
              
              {/* Artwork */}
              {artworkImage && (
                <div
                  className={`artwork-preview absolute transform -translate-x-1/2 -translate-y-1/2 transition-shadow ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    left: `${artworkPosition.x}%`,
                    top: `${artworkPosition.y}%`,
                    width: `${artworkScale * 100}%`,
                  }}
                >
                  <div className={`relative ${showFrame ? getFrameStyle() : ''} bg-white`}>
                    <img
                      src={artworkImage}
                      alt={artwork?.title}
                      className="w-full h-auto"
                      draggable={false}
                    />
                    {/* Frame mat for classic/ornate styles */}
                    {showFrame && (frameStyle === 'classic' || frameStyle === 'ornate') && (
                      <div className="absolute inset-0 border-4 border-white/50 pointer-events-none" />
                    )}
                  </div>
                  {/* Shadow under artwork */}
                  <div 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-black/20 blur-md rounded-full"
                  />
                </div>
              )}

              {/* Furniture */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] opacity-90">
                <FurnitureSVG type={selectedRoom.furniture} className="w-full" />
              </div>

              {/* Drag instruction */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm">
                Drag artwork to reposition
              </div>

              {/* Dimensions indicator */}
              {artwork?.dimensions && (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-700 shadow">
                  {artwork.dimensions.height} × {artwork.dimensions.width} {artwork.dimensions.unit}
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Room Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🛋️</span> Room Type
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_PRESETS.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomSelect(room)}
                      className={`p-2 text-xs rounded-lg border-2 transition-all ${
                        selectedRoom.id === room.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                      data-testid={`room-${room.id}`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wall Color */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🎨</span> Wall Color
                </h3>
                <div className="flex flex-wrap gap-2">
                  {WALL_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setCustomWallColor(color.color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        customWallColor === color.color
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.name}
                      data-testid={`color-${color.id}`}
                    />
                  ))}
                </div>
                {customWallColor && (
                  <button
                    onClick={() => setCustomWallColor(null)}
                    className="mt-2 text-xs text-orange-500 hover:text-orange-600"
                  >
                    Reset to room default
                  </button>
                )}
              </div>

              {/* Artwork Size */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📐</span> Artwork Size
                </h3>
                <input
                  type="range"
                  min="0.15"
                  max="0.6"
                  step="0.01"
                  value={artworkScale}
                  onChange={(e) => setArtworkScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  data-testid="artwork-size-slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>

              {/* Frame Options */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🖼️</span> Frame Style
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="showFrame"
                    checked={showFrame}
                    onChange={(e) => setShowFrame(e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="showFrame" className="text-sm text-gray-700">Show frame</label>
                </div>
                {showFrame && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'modern', name: 'Modern', preview: 'border-4 border-gray-800' },
                      { id: 'classic', name: 'Classic', preview: 'border-4 border-amber-700' },
                      { id: 'minimal', name: 'Minimal', preview: 'border-2 border-gray-300' },
                      { id: 'ornate', name: 'Ornate', preview: 'border-4 border-amber-600' },
                      { id: 'float', name: 'Float', preview: 'shadow-lg' },
                    ].map((frame) => (
                      <button
                        key={frame.id}
                        onClick={() => setFrameStyle(frame.id)}
                        className={`p-2 text-xs rounded-lg border-2 transition-all ${
                          frameStyle === frame.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`frame-${frame.id}`}
                      >
                        <div className={`w-8 h-6 mx-auto mb-1 bg-gray-200 ${frame.preview}`} />
                        {frame.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">💡 Tips</h4>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Drag artwork to find the perfect position</li>
                  <li>• Try different wall colors to match your space</li>
                  <li>• Use the size slider for scale visualization</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Reset to defaults
                    setArtworkScale(selectedRoom.defaultScale);
                    setArtworkPosition(selectedRoom.artworkPosition);
                    setCustomWallColor(null);
                    setShowFrame(true);
                    setFrameStyle('modern');
                  }}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Reset View
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                  data-testid="done-preview-btn"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
