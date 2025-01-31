import { BaseTexture, ISpritesheetData, Spritesheet } from 'pixi.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedSprite, Container, Graphics, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { Player as ServerPlayer } from '../../convex/aiTown/player.ts';
import { agents } from './AgentList';

// Static ref outside component to ensure it's shared across all instances
const static_zoomedCharacterId = { current: null as string | null };

// Add these static refs to store the initial camera state
const static_initialCameraState = {
  scale: 0.5,
  x: 0,
  y: 0,
  isSet: false
};

// Add a constant for consistent zoom level
const ZOOM_LEVEL = 1.1;

const calculateBoundedCameraPosition = (
  centerX: number,
  centerY: number,
  x: number,
  y: number,
  scale: number,
  stageWidth: number,
  stageHeight: number,
  worldWidth: number,
  worldHeight: number
) => {
  // Calculate the scaled dimensions
  const scaledWidth = stageWidth / scale;
  const scaledHeight = stageHeight / scale;
  
  // Calculate the boundaries
  const minX = scaledWidth / 2;
  const maxX = worldWidth - scaledWidth / 2;
  const minY = scaledHeight / 2;
  const maxY = worldHeight - scaledHeight / 2;
  
  // Calculate target position (centered on character)
  let targetX = centerX - (x * scale);
  let targetY = centerY - (y * scale);
  
  // Calculate the maximum allowed offsets
  const maxOffsetX = (worldWidth * scale) - stageWidth;
  const maxOffsetY = (worldHeight * scale) - stageHeight;
  
  // Clamp the target position to ensure the viewport stays within bounds
  targetX = Math.max(-maxOffsetX, Math.min(0, targetX));
  targetY = Math.max(-maxOffsetY, Math.min(0, targetY));
  
  return { x: targetX, y: targetY };
};

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
  player,
  worldWidth,
  worldHeight
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
  player: ServerPlayer;
  worldWidth: number;
  worldHeight: number;
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
  }, [textureUrl, spritesheetData]);

  useEffect(() => {
    if (isZoomed && containerRef.current?.parent) {
      // Only follow if this is the character we zoomed to
      if (static_zoomedCharacterId.current === player?.id) {
        const stage = containerRef.current.parent;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const agentName = agents.find(a => a.id === player.id)?.name || 'Unknown';
        console.log('Camera following:', {
          playerId: player.id,
          agentName,
          x, y
        });

        // Use the same animation function for smooth following
        const animateCamera = (
          targetScale: number,
          targetX: number,
          targetY: number
        ) => {
          const startScale = stage.scale.x;
          const startX = stage.position.x;
          const startY = stage.position.y;
          const duration = 15; // Half the duration of zoom animation for smoother following
          let frame = 0;

          const animate = () => {
            frame++;
            const progress = frame / duration;
            const easeProgress = Math.sin(progress * Math.PI / 2);

            stage.scale.set(
              startScale + (targetScale - startScale) * easeProgress
            );
            stage.position.set(
              startX + (targetX - startX) * easeProgress,
              startY + (targetY - startY) * easeProgress
            );

            if (frame < duration) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        };

        const boundedPosition = calculateBoundedCameraPosition(
          centerX,
          centerY,
          x,
          y,
          ZOOM_LEVEL,
          window.innerWidth,
          window.innerHeight,
          worldWidth,
          worldHeight
        );

        animateCamera(
          ZOOM_LEVEL,
          boundedPosition.x,
          boundedPosition.y
        );
      }
    }
  }, [isZoomed, x, y, player?.id, worldWidth, worldHeight]);

  const handleClick = useCallback(() => {
    if (!containerRef.current?.parent) return;
    const stage = containerRef.current.parent;
    
    // Animation helper function
    const animateCamera = (
      targetScale: number,
      targetX: number,
      targetY: number,
      onComplete?: () => void
    ) => {
      const startScale = stage.scale.x;
      const startX = stage.position.x;
      const startY = stage.position.y;
      const duration = 30; // frames (0.5 seconds at 60fps)
      let frame = 0;

      const animate = () => {
        frame++;
        const progress = frame / duration;
        const easeProgress = Math.sin(progress * Math.PI / 2); // Smooth easing

        stage.scale.set(
          startScale + (targetScale - startScale) * easeProgress
        );
        stage.position.set(
          startX + (targetX - startX) * easeProgress,
          startY + (targetY - startY) * easeProgress
        );

        if (frame < duration) {
          requestAnimationFrame(animate);
        } else {
          // Ensure we land exactly on target values
          stage.scale.set(targetScale);
          stage.position.set(targetX, targetY);
          onComplete?.();
        }
      };

      requestAnimationFrame(animate);
    };
    
    if (isZoomed) {
      if (static_zoomedCharacterId.current === player.id) {
        static_zoomedCharacterId.current = null;
        
        console.log('Zooming out:', {
          playerId: player.id,
          agentName: agents.find(a => a.id === player.id)?.name || 'Unknown'
        });

        // Zoom out to the stored position
        animateCamera(
          static_initialCameraState.scale,
          static_initialCameraState.x,
          static_initialCameraState.y,
          () => {
            setIsZoomed(false);
            static_initialCameraState.isSet = false;
          }
        );
      } 
      // If clicking a different character while zoomed
      else {
        static_zoomedCharacterId.current = player.id;
        
        console.log('Switching to:', {
          playerId: player.id,
          agentName: agents.find(a => a.id === player.id)?.name || 'Unknown'
        });

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const boundedPosition = calculateBoundedCameraPosition(
          centerX,
          centerY,
          x,
          y,
          ZOOM_LEVEL,
          window.innerWidth,
          window.innerHeight,
          worldWidth,
          worldHeight
        );

        animateCamera(
          ZOOM_LEVEL,
          boundedPosition.x,
          boundedPosition.y,
          () => {
            setIsZoomed(true);
          }
        );
      }
    } 
    // Not zoomed - zoom in to clicked character
    else {
      static_zoomedCharacterId.current = player.id;
      
      // Store current camera state before zooming in
      if (!static_initialCameraState.isSet) {
        static_initialCameraState.scale = stage.scale.x;
        static_initialCameraState.x = stage.position.x;
        static_initialCameraState.y = stage.position.y;
        static_initialCameraState.isSet = true;
      }
      
      console.log('Zooming in to:', {
        playerId: player.id,
        agentName: agents.find(a => a.id === player.id)?.name || 'Unknown'
      });

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const boundedPosition = calculateBoundedCameraPosition(
        centerX,
        centerY,
        x,
        y,
        ZOOM_LEVEL,
        window.innerWidth,
        window.innerHeight,
        worldWidth,
        worldHeight
      );

      animateCamera(
        ZOOM_LEVEL,
        boundedPosition.x,
        boundedPosition.y,
        () => {
          setIsZoomed(true);
        }
      );
    }
    
    onClick();
  }, [x, y, isZoomed, onClick, player?.id, worldWidth, worldHeight]);

  const roundedOrientation = Math.floor(orientation / 90);
  const direction = ['right', 'down', 'left', 'up'][roundedOrientation];

  const ref = useRef<PIXI.AnimatedSprite | null>(null);
  useEffect(() => {
    if (isMoving) {
      ref.current?.play();
    }
  }, [direction, isMoving]);

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
