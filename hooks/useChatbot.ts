import { useState, useEffect } from 'react';

type Message = {
  user?: string; // Optional for bot messages
  message: string;
  sender: 'user' | 'bot';
  timestamp: number;
};

const MESSAGE_LIMIT = 10;

export const useChatbot = () => {
  const enforceMessageLimitAndSave = (currentMessages: Message[]) => {
    const newMessages = currentMessages.slice(Math.max(currentMessages.length - MESSAGE_LIMIT, 0));
    localStorage.setItem('chatbot_messages_history', JSON.stringify(newMessages));
    return newMessages;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendMessage = async (messageContent?: string) => {
    const messageToUse = messageContent || input;
    if (!messageToUse.trim()) return;

    const userMessage: Message = {
      user: 'You',
      message: messageToUse,
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, userMessage];
      return enforceMessageLimitAndSave(updatedMessages);
    });
    const currentInput = messageToUse;

    setIsLoading(true);
    setIsInputDisabled(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput, userId: 'some-user-id' }), // Replace with actual user ID
      });

      if (!response.ok || !response.body) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let botResponse = '';

      const botInitialMessage: Message = {
        message: '',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, botInitialMessage]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        botResponse += chunk;
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].message = botResponse;
          return enforceMessageLimitAndSave(newMessages);
        });
      }
      // Save the final bot message to localStorage after streaming is complete
      setMessages((prevMessages) => enforceMessageLimitAndSave(prevMessages));

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        message: 'Sorry, something went wrong.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setCountdown(10); // Start 10-second countdown
    }
  };

  const handleCommand = (command: string) => {
    const [cmd, ...args] = command.trim().substring(1).split(/\s+/);
    let response = "";

    switch (cmd) {
      case "help":
        response = "Available commands: /about, /projects, /skills, /contact, /clear";
        break;
      case "about":
        window.scrollTo({ top: document.getElementById("about")?.offsetTop, behavior: "smooth" });
        response = "Navigating to about section...";
        break;
      case "projects":
        window.scrollTo({ top: document.getElementById("projects")?.offsetTop, behavior: "smooth" });
        response = "Navigating to projects section...";
        break;
      case "skills":
        window.scrollTo({ top: document.getElementById("skills")?.offsetTop, behavior: "smooth" });
        response = "Navigating to skills section...";
        break;
      case "contact":
        window.scrollTo({ top: document.getElementById("contact")?.offsetTop, behavior: "smooth" });
        response = "Navigating to contact section...";
        break;
      case "clear":
        setMessages([]);
        localStorage.removeItem('chatbot_messages_history');
        response = "Terminal cleared.";
        break;
      default:
        response = `Command not found: ${cmd}. Type 'help' for a list of commands.`;
    }

    const botMessage: Message = {
      message: response,
      sender: 'bot',
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => enforceMessageLimitAndSave([...prevMessages, botMessage]));
  };

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('chatbot_messages_history');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        // Initial welcome message if no history
        setMessages([
          {
            message: "Welcome to the terminal. Type 'help' to see available commands.",
            sender: 'bot',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error);
      // Fallback to initial message if localStorage fails
      setMessages([
        {
          message: "Welcome to the terminal. Type 'help' to see available commands.",
          sender: 'bot',
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInputDisabled && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isInputDisabled) {
      setIsInputDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [isInputDisabled, countdown]);


  const addSystemMessage = (message: string) => {
    const systemMessage: Message = {
      message: message,
      sender: 'bot',
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => enforceMessageLimitAndSave([...prevMessages, systemMessage]));
  };

  const clearMessages = () => {
    setMessages([
      { sender: 'bot', message: 'Chat history cleared. Type /help for available commands.', timestamp: Date.now() }
    ]);
    localStorage.setItem('chatbot_messages_history', JSON.stringify([{ sender: 'bot', message: 'Chat history cleared. Type /help for available commands.', timestamp: Date.now() }]));
  };

  const displayHelpMessage = () => {
    const helpMessage: Message = {
      sender: 'bot',
      message: 'Available commands:\n- /ai [your prompt]: Get AI assistance.\n- /help: Display this help message.\n- /clear: Clear the chat history.',
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => enforceMessageLimitAndSave([...prevMessages, helpMessage]));
  };

  return {
    messages,
    input,
    isLoading,
    isInputDisabled,
    countdown,
    setInput,
    sendMessage,
    handleCommand, // Still needed for internal command processing
    addSystemMessage,
    clearMessages,
    displayHelpMessage,
  };
};