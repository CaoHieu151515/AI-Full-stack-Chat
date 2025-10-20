
import React, { useMemo } from 'react';
import { Message, Role } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserIcon, BotIcon, AlertTriangleIcon, FileTextIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { role, content, timestamp, attachment, isLoading, isError } = message;

  const isUser = role === Role.USER;
  const isSystem = role === Role.SYSTEM;

  const bubbleClasses = isUser
    ? 'bg-blue-600 self-end rounded-br-none'
    : isSystem
    ? 'bg-yellow-600/20 text-yellow-300 self-center'
    : 'bg-gray-700 self-start rounded-bl-none';
  
  const alignmentClass = isUser ? 'items-end' : isSystem ? 'items-center' : 'items-start';

  const imageUrl = useMemo(() => {
    if (attachment?.type === 'image') {
      return URL.createObjectURL(attachment.file);
    }
    return null;
  }, [attachment]);

  const renderAttachment = () => {
    if (!attachment) return null;

    switch (attachment.type) {
      case 'image':
        return (
          <div className="mt-2">
            <p className="text-xs text-gray-400 italic mb-1">Uploaded: {attachment.name}</p>
            <img src={imageUrl!} alt={attachment.name} className="rounded-lg max-w-xs max-h-64 object-contain" />
          </div>
        );
      default:
        return null;
    }
  };

  const Icon = isUser ? UserIcon : isSystem ? FileTextIcon : BotIcon;
  const iconColor = isUser ? 'text-blue-300' : isSystem ? 'text-yellow-300' : 'text-cyan-400';

  return (
    <div className={`flex flex-col mb-4 ${alignmentClass}`}>
      <div className="flex items-start max-w-full md:max-w-3xl">
          {!isUser && !isSystem && <Icon className={`w-8 h-8 rounded-full p-1.5 mr-3 flex-shrink-0 bg-gray-700 ${iconColor}`} />}
          <div className={`relative px-4 py-3 rounded-lg ${bubbleClasses} transition-all duration-300`}>
              {isError && <AlertTriangleIcon className="absolute -top-2 -left-2 w-5 h-5 text-red-400" />}
              {isLoading ? (
                  <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                  </div>
              ) : (
                  <article className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-blockquote:my-2 prose-ol:my-2 prose-ul:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {content}
                      </ReactMarkdown>
                  </article>
              )}
              {renderAttachment()}
          </div>
          {isUser && <Icon className={`w-8 h-8 rounded-full p-1.5 ml-3 flex-shrink-0 bg-blue-600 ${iconColor}`} />}
      </div>
      {!isSystem && <p className="text-xs text-gray-500 mt-1 px-12">{timestamp.toLocaleTimeString()}</p>}
    </div>
  );
};

export default MessageBubble;
