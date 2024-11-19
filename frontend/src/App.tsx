import React, { useState, useEffect } from 'react';
import './App.css'
import logo from './assets/DocTalkLogo.png';
import AutoScrollComponent from './components/AutoScrollComponent';
import SpeechRecognition from './components/SpeechRecognition';
import RealTimeTranslation from './components/RealTimeTranslation';
import AudioVisualizer from './components/AudioVisualizer';
import Button from '@mui/material/Button'


interface Message {
  id: number;
  original: string;
  translated: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [audioData, setAudioData] = useState<number[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    setDebugInfo('App mounted');
  }, []);

  const addMessage = (original: string, translated: string) => {
    setMessages(prev => [...prev, { id: Date.now(), original, translated }]);
  };

  const handleTranscript = (transcript: string, audioFrequencyData: number[]) => {
    // Only update if transcript is not empty
    if (transcript.trim()) {
      setCurrentText(transcript);
      setAudioData(audioFrequencyData);
      // Add message immediately when transcript is received
      addMessage(transcript, ''); // Add with empty translation
      setDebugInfo(`Received transcript: ${transcript.slice(0, 20)}... and audio data of length ${audioFrequencyData.length}`);
    }
  };

  const handleTranslation = (translatedText: string) => {
    // Update the most recent message with the translation
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && !lastMessage.translated) {
        // Update only the last message that doesn't have a translation
        return [
          ...prev.slice(0, -1),
          { ...lastMessage, translated: translatedText }
        ];
      }
      return prev;
    });
    setCurrentText('');
  };

  return (
    <div className='main'>
      <div className='screen'>
        <div className="column one">
          <AutoScrollComponent className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">{message.original}</div>
            ))}
          </AutoScrollComponent>
        </div>
        <div className="column two">
          <SpeechRecognition onTranscript={handleTranscript} />
        </div>
        <div className="column three">
          <AutoScrollComponent className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">{message.translated}</div>
            ))}
          </AutoScrollComponent>
        </div>
      </div>
      <div className='button-section'>
            <button className='docNotes button'>Doctor Notes</button>
            <button className='clear button'>Clear</button>
            <button className='language button'>Language</button>
      </div>
      <RealTimeTranslation text={currentText} onTranslated={handleTranslation} />
    </div>
  );
}

export default App;