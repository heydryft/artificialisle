import { useCallback, useEffect, useState } from 'react';
import Button from './Button';
import chatImg from '../../../assets/chat.svg';
import closeImg from '../../../assets/close.svg';
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
        <div className="fixed bottom-32 right-4 w-[420px] chats">
          <div className="bg-[#ffe478] text-black">
            <div className="box w-full">
              <div className="bg-[#964253] p-2 flex justify-between items-center">
                <h3 className="text-white text-lg">Chat</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="button"
                >
                  <div className="h-4 w-4 bg-clay-700 flex items-center justify-center">
                    <img className="w-4 h-4" src={closeImg} alt="Close" />
                  </div>
                </button>
              </div>
            </div>
            
            <div className="h-96 overflow-y-auto p-2 space-y-2 scrollbar-custom">
              {messages.map((msg, index) => (
                <div key={index} className="bubble">
                  <div className="bg-white -mx-3 -my-1">
                    <span className="font-bold">{msg.user}</span>
                    <span className="ml-2">{msg.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <form 
              className="p-2 flex gap-2"
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
              <div className="flex-1 box">
                <input
                  name="message"
                  type="text"
                  className="w-full bg-white px-2 py-1.5 text-black placeholder-gray-500 focus:outline-none focus:ring-0"
                  placeholder="Type a message..."
                />
              </div>
              <button
                type="submit"
                className="button"
              >
                <div className="h-full bg-clay-700 text-white px-4">
                  Send
                </div>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}