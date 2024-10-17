import React, { useState } from 'react';
import './App.css'
import logo from './assets/DocTalkLogo.png';
import AutoScrollComponent from './components/AutoScrollComponent';
import SpeechRecognition from './components/SpeechRecognition';

interface Message {
  id: number;
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now(), text }]);
  };
  const handleTranscript = (transcript: string) => {
    addMessage(transcript);
  };
  console.log(addMessage);

  return (
    <div className='main'>
      <img src={logo} className='logo' alt="DocTalk Logo" />
      <div className='screen'>
        <div className="column one">
        <AutoScrollComponent className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">{message.text}</div>
            ))}
          </AutoScrollComponent>
        </div>
        <div className="column two">
        <SpeechRecognition onTranscript={handleTranscript} />
        <div className="flex justify-between mt-8">
      </div>
        </div>
        <div className="column three">
          <AutoScrollComponent className="scroll-area">
              {messages.map((message) => (
                <div key={message.id} className="message">{message.text}</div>
              ))}
          </AutoScrollComponent>
        </div>
      </div>
    </div>
  )
}

export default App