import React, { useState, useEffect } from 'react';
import './App.css'
import logo from './assets/DocTalkLogo.png';
import AutoScrollComponent from './components/AutoScrollComponent';
import SpeechRecognition from './components/SpeechRecognition';
import Translation from './components/Translation';
import AudioVisualizer from './components/AudioVisualizer';

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
    setCurrentText(transcript);
    setAudioData(audioFrequencyData);
    setDebugInfo(`Received transcript: ${transcript.slice(0, 20)}... and audio data of length ${audioFrequencyData.length}`);
  };

  const handleTranslation = (translatedText: string) => {
    addMessage(currentText, translatedText);
    setCurrentText('');
  };

  return (
    <div className='main'>
      <img src={logo} className='logo' alt="DocTalk Logo" />
      <div className='screen'>
        <div className="column one">
          <AutoScrollComponent className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">{message.original}</div>
            ))}
          </AutoScrollComponent>
        </div>
        <div className="column two">
          <AudioVisualizer audioData={audioData} />
          <SpeechRecognition onTranscript={handleTranscript} />
          <div style={{ color: 'white', marginTop: '10px' }}>App Debug: {debugInfo}</div>
        </div>
        <div className="column three">
          <AutoScrollComponent className="scroll-area">
            {messages.map((message) => (
              <div key={message.id} className="message">{message.translated}</div>
            ))}
          </AutoScrollComponent>
        </div>
      </div>
      <Translation text={currentText} onTranslated={handleTranslation} />
    </div>
  );
}

export default App;