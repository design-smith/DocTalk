import React, { useState, useEffect } from 'react';

interface SpeechRecognitionProps {
  onTranscript: (text: string) => void;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        onTranscript(transcript);
      };

      setRecognition(recognition);
    }
  }, [onTranscript]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
    </div>
  );
};

export default SpeechRecognition;