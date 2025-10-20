import React, { useState, useCallback, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import { Message, Role, Model, CsvData } from './types';
import { parseCsv } from './services/geminiService';
import { GoogleGenAI, Chat } from '@google/genai';

const initialMessage: Message = {
  id: '1',
  role: Role.ASSISTANT,
  content: 'Hello! How can I help you today? You can ask me anything, upload an image, or provide a CSV file for analysis by pasting its URL or uploading it.',
  timestamp: new Date(),
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<Model>(Model.FLASH);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const csvDataRef = useRef<CsvData | null>(null);
  const csvRawTextRef = useRef<string | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...message, id: Date.now().toString(), timestamp: new Date() },
    ]);
  }, []);

  const handleSendMessage = async (text: string, image?: File) => {
    const trimmedText = text.trim();
    const csvUrlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*\.csv)$/i;

    // If the input is a CSV URL and no image is attached, treat it as a CSV load request.
    if (csvUrlRegex.test(trimmedText) && !image) {
      handleCsvLoad(trimmedText);
      return;
    }
    
    // The API key is now sourced from process.env.API_KEY as per best practices.
    // If the key is missing, the GoogleGenAI constructor will throw an error, 
    // which is caught by the try-catch block below.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: new Date(),
      attachment: image ? { type: 'image', file: image, name: image.name } : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add a placeholder for the assistant's response
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: Role.ASSISTANT,
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      if (image) {
        // Handle image analysis as a stateless, one-shot call
        const fileToGenerativePart = async (file: File) => {
          const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
          };
        };

        const imagePart = await fileToGenerativePart(image);
        const textPart = { text: text || 'Describe this image.' };
        
        const responseStream = await ai.models.generateContentStream({
            model: Model.FLASH, 
            contents: { parts: [imagePart, textPart] },
        });

        for await (const chunk of responseStream) {
           if (chunk.text) {
             setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk.text, isLoading: false }
                  : msg
              )
            );
          }
        }
      } else if (csvDataRef.current && csvRawTextRef.current) {
        // Handle CSV queries using the full data context
        const csvHeaders = csvDataRef.current.data.length > 0 ? Object.keys(csvDataRef.current.data[0]).join(', ') : 'empty file';
        const fullData = csvRawTextRef.current;

        const systemInstruction = `You are a CSV data analysis expert. Your ONLY job is to answer questions based on the provided CSV data.

**CRITICAL RULES:**
1.  **COLUMN LOCK:** When the user mentions a specific column name (like 'First Name', 'City', etc.), you MUST perform your search, filter, or calculation ONLY on that exact column. **DO NOT** use any other column. For example, if the user says "find people in 'First Name' with 'z'", you look ONLY in the 'First Name' column. You MUST ignore all other columns for that query. This is the most important rule.
2.  **DATA IS KING:** Your answers MUST come ONLY from the CSV data provided. Do not make up information. If you can't answer from the data, say so.
3.  **BE LITERAL:** Follow the user's instructions exactly. Do not guess what they mean.
4.  **CASE-INSENSITIVE SEARCH:** All text searches must be case-insensitive (e.g., 'z' matches 'Z') unless the user specifically asks for a case-sensitive search.
5.  **USE TABLES:** Display results in markdown tables whenever it is the best format for the data.

**Provided CSV Data:**
- **Available Columns:** ${csvHeaders}
- **Data:**
\`\`\`csv
${fullData}
\`\`\`
`;

        const history = messages
          .filter(msg => (msg.role === Role.USER || msg.role === Role.ASSISTANT) && msg.id !== assistantMessageId && msg.id !== userMessage.id)
          .map(msg => ({
            role: msg.role === Role.USER ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }));
        
        const contents = [...history, { role: 'user', parts: [{ text }] }];

        const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents: contents,
            config: { 
              systemInstruction,
              temperature: 0,
            },
        });

        for await (const chunk of responseStream) {
           if (chunk.text) {
             setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk.text, isLoading: false }
                  : msg
              )
            );
          }
        }

      } else {
        // Handle text-only chat with a persistent session
        let session = chatSession;
        if (!session) {
          const history = messages
            .filter(
              (msg) =>
                (msg.role === Role.USER || msg.role === Role.ASSISTANT) &&
                !msg.isLoading && !msg.isError && msg.content &&
                msg.id !== assistantMessageId && msg.id !== userMessage.id
            )
            .map((msg) => ({
                role: msg.role === Role.USER ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }));
            
          session = ai.chats.create({
            model: currentModel,
            history: history,
          });
          setChatSession(session);
        }
        
        const stream = await session.sendMessageStream({ message: text });
        for await (const chunk of stream) {
          if (chunk.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk.text, isLoading: false }
                  : msg
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Sorry, I encountered an error: ${errorMessage}`,
                isError: true,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, isLoading: false } : msg
        )
      );
    }
  };

  const handleCsvLoad = async (file: File | string) => {
    setIsLoading(true);
    const fileName = typeof file === 'string' ? file.split('/').pop() || 'file.csv' : file.name;
    const sourceText = typeof file === 'string' ? `URL: ${file}` : `file: ${fileName}`;
    addMessage({
      role: Role.SYSTEM,
      content: `Loading and parsing CSV data from ${sourceText}...`,
    });

    try {
      const { data: parsedData, rawText } = await parseCsv(file);
      if (!parsedData || parsedData.length === 0) {
        throw new Error('CSV file is empty or could not be parsed.');
      }
      
      csvDataRef.current = { id: fileName, data: parsedData };
      csvRawTextRef.current = rawText;
      setChatSession(null); // Reset chat session to apply new context

      addMessage({
          role: Role.SYSTEM,
          content: `Successfully loaded "${fileName}". The AI now has full context of the file. You can ask questions about its content.`,
      });
    } catch (error) {
       console.error('Error loading CSV:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
       addMessage({
        role: Role.SYSTEM,
        content: `Failed to load CSV: ${errorMessage}`,
        isError: true,
      });
      csvDataRef.current = null;
      csvRawTextRef.current = null;
    } finally {
        setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([initialMessage]);
    setChatSession(null);
    csvDataRef.current = null;
    csvRawTextRef.current = null;
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header 
        onNewChat={handleNewChat} 
        onCsvLoad={handleCsvLoad}
        isLoading={isLoading}
      />
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <ChatWindow messages={messages} />
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          model={currentModel}
          setModel={(model) => {
              setCurrentModel(model);
              setChatSession(null);
          }}
          isCsvLoaded={!!csvDataRef.current}
        />
      </div>
    </div>
  );
};

export default App;