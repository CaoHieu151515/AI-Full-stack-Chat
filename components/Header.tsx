import React, { useRef } from 'react';
import { FilePlusIcon, MessageSquarePlusIcon } from './icons';

interface HeaderProps {
  onNewChat: () => void;
  onCsvLoad: (file: File) => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewChat, onCsvLoad, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCsvLoad(file);
    }
  };

  return (
    <header className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-700 shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-cyan-400">Gemini Chat</h1>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onNewChat}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <MessageSquarePlusIcon className="w-4 h-4 mr-2" />
          New Chat
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <FilePlusIcon className="w-4 h-4 mr-2" />
          Upload CSV
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv"
        />
      </div>
    </header>
  );
};

export default Header;