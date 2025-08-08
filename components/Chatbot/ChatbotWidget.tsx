"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useChatbot } from "@/hooks/useChatbot";
import { VscTerminalBash } from "react-icons/vsc";
import { RiRobot2Line } from "react-icons/ri";
import { BiSolidSend } from "react-icons/bi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const availableCommands = ["/ai", "/help", "/clear"];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    input,
    isLoading,
    isInputDisabled,
    countdown,
    setInput,
    sendMessage,
    clearMessages,
    displayHelpMessage,
  } = useChatbot();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null); // Ref for the last message
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [highlightedCommandIndex, setHighlightedCommandIndex] = useState(-1);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = (messageContent?: string) => {
    const messageToProcess = messageContent || input;
    if (messageToProcess.startsWith("/ai ")) {
      sendMessage(messageToProcess);
    } else if (messageToProcess==="/clear" || messageToProcess.startsWith("/clear ")) {
      clearMessages();
    } else if (messageToProcess==="/help" || messageToProcess.startsWith("/help ") || !messageToProcess.startsWith("/")) {
      displayHelpMessage();
    }
    setInput("");
  };

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Scroll on message change or streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      updateCursorPosition();
    }
  }, [isOpen]);

  const updateCursorPosition = () => {
    if (inputRef.current) {
      const inputElement = inputRef.current;
      const tempSpan = document.createElement("span");
      const computedStyle = getComputedStyle(inputElement);

      tempSpan.style.font = computedStyle.font;
      tempSpan.style.letterSpacing = computedStyle.letterSpacing;
      tempSpan.style.paddingLeft = computedStyle.paddingLeft;
      tempSpan.style.paddingRight = computedStyle.paddingRight;
      tempSpan.style.borderLeftWidth = computedStyle.borderLeftWidth;
      tempSpan.style.borderRightWidth = computedStyle.borderRightWidth;
      tempSpan.style.boxSizing = computedStyle.boxSizing;
      tempSpan.style.textIndent = computedStyle.textIndent;
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "pre";

      tempSpan.textContent = input.substring(0, inputElement.selectionStart || 0);
      document.body.appendChild(tempSpan);
      const cursorX = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);

      const popupBottom = inputElement.offsetHeight + 8;
      setCursorPosition({ x: cursorX, y: popupBottom });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    setShowCommands(availableCommands.filter((cmd) => cmd.startsWith(newValue)).length > 0);
    if (!newValue.startsWith("/")) {
      setHighlightedCommandIndex(-1);
    }
    updateCursorPosition();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filteredCommands = availableCommands.filter((cmd) => cmd.startsWith(input));
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedCommandIndex((prevIndex) =>
          prevIndex <= 0 ? filteredCommands.length - 1 : prevIndex - 1
        );
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedCommandIndex((prevIndex) =>
          prevIndex === filteredCommands.length - 1 ? 0 : prevIndex + 1
        );
      } else if (e.key === "Enter") {
        if (highlightedCommandIndex !== -1) {
          e.preventDefault();
          const selectedCommand = filteredCommands[highlightedCommandIndex];
          setInput(selectedCommand);
          setShowCommands(false);
          setHighlightedCommandIndex(-1);
        } else if (!isInputDisabled) {
          e.preventDefault();
          handleSendMessage();
        }
      }
    } else if (e.key === "Enter" && !isInputDisabled) {
      e.preventDefault();
      handleSendMessage();
    }
    updateCursorPosition();
  };

  return (
    <AnimatePresence>
      {!isOpen ? (
        <motion.div
          key="chatbot-toggle"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={toggleChat}
                  className="fixed bottom-4 right-4 h-16 w-fit px-4 gap-2 text-white rounded-full bg-primary/5 text-primary-foreground backdrop-blur-sm hover:bg-primary/15 flex items-center justify-center cursor-pointer transition-all group"
                >
                  <VscTerminalBash className="text-white text-3xl" /> ayush-gpt
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Terminal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      ) : (
        <motion.div
          key="chatbot-widget"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="fixed bottom-4 inset-x-4 sm:right-4 sm:left-auto z-50 w-[calc(100vw-2rem)] sm:w-96"
        >
          <Card className="h-[80vh] sm:h-[32rem] flex flex-col bg-transparent backdrop-blur-md border-zinc-700 terminal-glow">
            <CardHeader className="flex flex-row items-center justify-between p-2 bg-zinc-900/80 border-b border-zinc-700 rounded-tl-lg rounded-tr-lg">
              <CardTitle className="font-mono text-emerald-400 flex items-center gap-2 text-xl">
                <VscTerminalBash className="text-white text-3xl" />
                ayush-gpt
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={toggleChat}>
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow p-3 font-mono text-sm bg-zinc-900 text-gray-200 overflow-auto space-y-3 rounded-bl-lg rounded-br-lg">
              <div ref={chatContainerRef} className="flex-grow overflow-y-auto custom-scrollbar space-y-3">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                    className="flex"
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                  >
                    <span
                      className={msg.sender === "user" ? "text-cyan-400" : "text-emerald-400"}
                    >
                      <span className="mr-1">{msg.sender === "user" ? ">" : "$"}</span>
                    </span>
                    {msg.sender !== "user" ? (
                      <div className="flex flex-col gap-2">
                        <span className="mr-1 text-emerald-400 flex">
                          <RiRobot2Line className="text-xl font-bold" />
                          &nbsp;{'>'}
                        </span>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                          {msg.message}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-emerald-400 text-base">{msg.message}</span>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <div ref={lastMessageRef}>
                    <span className="text-emerald-400">$ </span>
                    <span className="blinking-cursor">▋</span>
                  </div>
                )}
              </div>
              <form
                className="flex w-full items-center space-x-2 pt-2 border-t border-zinc-700"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isInputDisabled) {
                    handleSendMessage();
                  }
                }}
              >
                <span className="text-emerald-400 pl-2">{'>'}</span>
                <div className="relative flex-1 flex items-center">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={isInputDisabled ? `Input disabled (${countdown}s)` : "type command here..."}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    disabled={isInputDisabled}
                    className="flex-grow bg-zinc-900 border border-zinc-700 focus:ring-0 focus:outline-none text-cyan-400 placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <AnimatePresence>
                    {showCommands && input !== "" && availableCommands.filter((cmd) => cmd.startsWith(input)).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bg-zinc-800 text-white p-2 rounded-md text-xs z-10"
                        style={{ left: cursorPosition.x, bottom: cursorPosition.y }}
                      >
                        {availableCommands
                          .filter((cmd) => cmd.startsWith(input))
                          .map((cmd, index) => (
                            <div
                              key={cmd}
                              className={`cursor-pointer px-2 py-1 ${
                                index === highlightedCommandIndex ? "bg-blue-600" : ""
                              }`}
                              onClick={() => {
                                setInput(cmd);
                                setShowCommands(false);
                                setHighlightedCommandIndex(-1);
                                if (inputRef.current) {
                                  inputRef.current.focus();
                                }
                              }}
                            >
                              {cmd}
                            </div>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  onClick={() => handleSendMessage()}
                  disabled={isInputDisabled}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <BiSolidSend className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatbotWidget;