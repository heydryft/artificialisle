import { BaseTexture, ISpritesheetData, Spritesheet } from 'pixi.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedSprite, Container, Graphics, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';

export const Character = ({
  textureUrl,
  spritesheetData,
  x,
  y,
  orientation,
  isMoving = false,
  isThinking = false,
  isSpeaking = false,
  emoji = '',
  isViewer = false,
  speed = 0.1,
  onClick,
}: {
  textureUrl: string;
  spritesheetData: ISpritesheetData;
  x: number;
  y: number;
  orientation: number;
  isMoving?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  emoji?: string;
  isViewer?: boolean;
  speed?: number;
  onClick: () => void;
}) => {
  const [spriteSheet, setSpriteSheet] = useState<Spritesheet>();
  const containerRef = useRef<PIXI.Container>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const parseSheet = async () => {
      const sheet = new Spritesheet(
        BaseTexture.from(textureUrl, {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
        }),
        spritesheetData,
      );
      await sheet.parse();
      setSpriteSheet(sheet);
    };
    void parseSheet();
  }, []);

  const roundedOrientation = Math.floor(orientation / 90);
  const direction = ['right', 'down', 'left', 'up'][roundedOrientation];

  const ref = useRef<PIXI.AnimatedSprite | null>(null);
  useEffect(() => {
    if (isMoving) {
      ref.current?.play();
    }
  }, [direction, isMoving]);

  useEffect(() => {
    if (isZoomed && containerRef.current?.parent) {
      const stage = containerRef.current.parent;
      const zoomLevel = 1.1;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      stage.scale.set(zoomLevel);
      stage.position.set(
        centerX - (x * zoomLevel),
        centerY - (y * zoomLevel)
      );
    }
  }, [isZoomed, x, y]); // Update when position changes

  const handleClick = useCallback(() => {
    
    // Execute existing click handler
    onClick();

    // Toggle zoom state
    setIsZoomed(prev => !prev);

    if (containerRef.current?.parent) {
        const stage = containerRef.current.parent;
        
        if (!isZoomed) {
          // Zoom in - center on character position
          const zoomLevel = 1.5;
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          
          stage.scale.set(zoomLevel);
          stage.position.set(
            centerX - (x * zoomLevel),
            centerY - (y * zoomLevel)
          );
        } else {
            // Zoom out to center of map
          const mapCenterX = 1249 / 2;  // 624.5
          const mapCenterY = 295 / 2;   // 147.5
          stage.scale.set(0.5);
          stage.position.set(mapCenterX, mapCenterY);
        }
      }
  }, [x, y, isZoomed, onClick]);

  if (!spriteSheet) return null;

  let blockOffset = { x: 0, y: 0 };
  switch (roundedOrientation) {
    case 2:
      blockOffset = { x: -20, y: 0 };
      break;
    case 0:
      blockOffset = { x: 20, y: 0 };
      break;
    case 3:
      blockOffset = { x: 0, y: -20 };
      break;
    case 1:
      blockOffset = { x: 0, y: 20 };
      break;
  }

  return (
    <Container 
      ref={containerRef}
      x={x} 
      y={y} 
      interactive={true} 
      pointerdown={handleClick}
      cursor="pointer"

    >
      {isThinking && (
        <Text 
          x={-20} 
          y={-10} 
          scale={{ x: -0.8, y: 0.8 }} 
          text={'💭'} 
          anchor={{ x: 0.5, y: 0.5 }} 
        />
      )}
      {isSpeaking && (
        <Text 
          x={18} 
          y={-10} 
          scale={0.8} 
          text={'💬'} 
          anchor={{ x: 0.5, y: 0.5 }} 
        />
      )}
      {isViewer && <ViewerIndicator />}
      <AnimatedSprite
        ref={ref}
        isPlaying={isMoving}
        textures={spriteSheet.animations[direction]}
        animationSpeed={speed}
        anchor={{ x: 0.5, y: 0.5 }}
      />
      {emoji && (
        <Text 
          x={0} 
          y={-24} 
          scale={{ x: -0.8, y: 0.8 }} 
          text={emoji} 
          anchor={{ x: 0.5, y: 0.5 }} 
        />
      )}
    </Container>
  );
};

function ViewerIndicator() {
  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    g.beginFill(0xffff0b, 0.5);
    g.drawRoundedRect(-10, 10, 20, 10, 100);
    g.endFill();
  }, []);

  return <Graphics draw={draw} />;
}

export default Character;
