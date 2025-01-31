import { useRef, useState } from 'react';
import PixiGame from './PixiGame.tsx';
import upImg from '../../assets/upwhite.svg';
import downImg from '../../assets/downwhite.svg';
import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';
import Button from './buttons/Button.tsx';

export const SHOW_DEBUG_UI = false;

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;

  const game = useServerGame(worldId);

  // Send a periodic heartbeat to our world to keep it alive.
  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);

  const scrollViewRef = useRef<HTMLDivElement>(null);

  const [isPlayerDetailOpen, setIsPlayerDetailOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);

  const togglePlayerDetail = () => {
    setIsPlayerDetailOpen(!isPlayerDetailOpen);
  };

  const toggleMobileDrawer = () => {
    setIsMobileDrawerOpen(!isMobileDrawerOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
  };

  if (!worldId || !engineId || !game) {
    return null;
  }
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Full screen game area */}
      <div 
        className="w-full h-full"
        ref={gameWrapperRef}
      >
        <Stage width={width} height={height} options={{ backgroundColor: 0x4ca6ff }}>
          <ConvexProvider client={convex}>
            <PixiGame
              game={game}
              worldId={worldId}
              engineId={engineId}
              width={width}
              height={height}
              historicalTime={historicalTime}
              setSelectedElement={setSelectedElement}
              togglePlayerDetail={setIsPlayerDetailOpen}
            />
          </ConvexProvider>
        </Stage>
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={`fixed top-0 ${
          isDesktopSidebarOpen ? 'left-0' : '-left-96'
        } h-full w-96 transition-all duration-300 ease-in-out hidden lg:block`}
      >
        <div className="relative h-full">
          <button
            className="absolute -right-8 top-1/2 -translate-y-1/2 transform bg-black/40 p-2 rounded-r-lg backdrop-blur-sm hover:bg-black/50 transition-colors"
            onClick={toggleDesktopSidebar}
          >
            <img 
              src={isDesktopSidebarOpen ? upImg : downImg} 
              width={20} 
              height={20} 
              alt="toggle" 
              className="opacity-90 hover:opacity-100 -rotate-90"
            />
          </button>

          <div className="h-full w-full bg-black/30 backdrop-blur-md text-white overflow-y-auto">
            <div className="p-6">
              <PlayerDetails
                worldId={worldId}
                engineId={engineId}
                game={game}
                playerId={selectedElement?.id}
                setSelectedElement={setSelectedElement}
                scrollViewRef={scrollViewRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div 
        className={`fixed inset-x-0 bottom-0 lg:hidden transition-transform duration-300 ease-in-out z-50 ${
          isMobileDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-5.5rem)]'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="bg-black/30 backdrop-blur-md rounded-t-xl text-white">
          {/* Mobile Header/Handle */}
          <div className="px-4 py-3 flex justify-between items-center border-b border-white/10">
            <div className="box w-fit">
              <p className="bg-[#964253] p-1 text-2xl text-white">DexMap</p>
            </div>
            <button 
              onClick={toggleMobileDrawer}
              className="p-2"
            >
              <img 
                src={isMobileDrawerOpen ? downImg : upImg} 
                width={24} 
                height={24} 
                alt="toggle" 
                className="opacity-90 hover:opacity-100"
              />
            </button>
          </div>

          {/* Mobile Content */}
          <div className="max-h-[70vh] overflow-y-auto text-white">
            <div className="p-6">
              <PlayerDetails
                worldId={worldId}
                engineId={engineId}
                game={game}
                playerId={selectedElement?.id}
                setSelectedElement={setSelectedElement}
                scrollViewRef={scrollViewRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
