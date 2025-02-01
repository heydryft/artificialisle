import { useCallback, useEffect, useState } from 'react';
import Button from './Button';
import chatImg from '../../../assets/chat.svg';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'react-toastify';

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUrl = window.location.hostname;
  console.log("currentUrl"+currentUrl);
  console.log("window.location.hostname"+window.location.hostname);
  const messages = useQuery(api.aiTown.main.getMessages, { url: currentUrl }) || [];
  const sendMessage = useMutation(api.aiTown.main.sendMessage);



  // Toggle chat with 'C' key
  const handleKeyPress = useCallback(
    (event: { key: string }) => {
      if (event.key === 'c' || event.key === 'C') {
        setIsOpen(!isOpen);
      }
    },
    [isOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="block"
        title="Open chat (press c to toggle)"
        imgUrl={chatImg}
      >
        Chat
      </Button>
      
      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-80 bg-clay-700 rounded-lg shadow-solid text-white">
          <div className="p-4 border-b border-clay-600 flex justify-between items-center">
            <h3 className="text-lg">Chat - {currentUrl}</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-clay-300 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="bg-clay-600 rounded-lg p-2"
              >
                <span className="font-bold">{msg.user}:</span> {msg.text}
              </div>
            ))}
          </div>

          <form 
            className="p-4 border-t border-clay-600 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
              const message = input.value.trim();
              
              if (!message) return;
              
              try {
                await sendMessage({
                  text: message,
                  url: currentUrl,
                });
                input.value = '';
              } catch (error) {
                toast.error('Failed to send message');
              }
            }}
          >
            <input
              name="message"
              type="text"
              className="flex-1 bg-clay-600 rounded px-3 py-2 text-white placeholder-clay-400" // Added text-white and placeholder color
              placeholder="Type a message..."
              style={{ color: 'black' }} 
            />
            <button
              type="submit"
              className="bg-clay-800 px-4 py-2 rounded hover:bg-clay-900"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}