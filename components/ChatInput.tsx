import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Model } from '../types';
import { SendIcon, PaperclipIcon, ZapIcon, BrainCircuitIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (text: string, image?: File) => void;
  isLoading: boolean;
  model: Model;
  setModel: (model: Model) => void;
  isCsvLoaded: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  model,
  setModel,
  isCsvLoaded,
}) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmedText = text.trim();
    if (!trimmedText && !imageFile) return;

    onSendMessage(trimmedText, imageFile || undefined);
    
    setText('');
    setImageFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 bg-gray-900/50 border-t border-gray-700">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gray-800 border border-gray-600 rounded-lg shadow-sm">
          {imageFile && (
            <div className="p-2 border-b border-gray-600">
              <div className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                  <span className="text-sm text-gray-300">Image: {imageFile.name}</span>
                  <button onClick={() => setImageFile(null)} className="text-gray-400 hover:text-white">&times;</button>
              </div>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoading ? "Processing..." : isCsvLoaded ? "Ask about your data, or send a general message..." : "Type a message or upload an image..."}
            className="w-full p-4 pr-28 bg-transparent rounded-lg focus:outline-none resize-none text-gray-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            disabled={isLoading}
            style={{ maxHeight: '200px' }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              disabled={isLoading}
              title="Attach Image"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
            <button
              onClick={handleSend}
              className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || (!text.trim() && !imageFile)}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end mt-2 space-x-4">
            <span className="text-xs text-gray-400">Model:</span>
            <button 
                onClick={() => setModel(Model.FLASH)} 
                className={`flex items-center px-2 py-1 text-xs rounded-md transition-colors ${model === Model.FLASH ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading}
            >
                <ZapIcon className="w-3 h-3 mr-1" /> Flash
            </button>
            <button 
                onClick={() => setModel(Model.PRO)} 
                className={`flex items-center px-2 py-1 text-xs rounded-md transition-colors ${model === Model.PRO ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading}
            >
                <BrainCircuitIcon className="w-3 h-3 mr-1" /> Pro
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;