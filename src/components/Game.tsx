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

  const togglePlayerDetail = () => {
    setIsPlayerDetailOpen(!isPlayerDetailOpen);
  };

  if (!worldId || !engineId || !game) {
    return null;
  }
  return (
    <div className="flex flex-col h-screen w-full lg:flex-row">
      {/* Game area (full width on mobile, right column on desktop) */}
      <div
        className="flex-grow overflow-hidden bg-blue-400 order-1 lg:order-2"
        ref={gameWrapperRef}
      >
        <div className="w-full h-full">
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
      </div>

      {/* Player Details area (expandable on mobile, left column on desktop) */}
      <div className="lg:w-96  flex-shrink-0 bg-blue-300 text-brown-100  lg:border-t-0 lg:border-r-4 border-t-4 border-black order-2 lg:order-1">
        {/* Mobile toggle button */}
        <button
          className="lg:hidden w-full py-2 px-2 flex justify-between items-center bg-transparent border-b-4 border-black text-white"
          onClick={togglePlayerDetail}
        >
          <div className=" w-fit lg:w-full lg:text-center text-2xl lg:text-5xl font-bold font-display shadow-solid box">
            <p className="bg-[#964253] p-1">DexMap</p>
          </div>
          <div className="connect-wallet">
            <button className=" flex  justify-center text-white shadow-solid  pointer-events-auto ">
              <img src={isPlayerDetailOpen ? downImg : upImg} width={31} height={31} alt="up" />
            </button>
          </div>
        </button>

        {/* Player Details content */}
        <div
          className={`overflow-y-auto transition-all duration-300 ease-in-out ${
            isPlayerDetailOpen ? 'max-h-96 lg:max-h-full' : 'max-h-0 lg:max-h-full'
          } lg:h-full`}
          ref={scrollViewRef}
        >
          <div className="px-4 py-6">
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
  );
}
