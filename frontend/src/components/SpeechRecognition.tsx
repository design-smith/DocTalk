import React, { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionProps {
  onTranscript: (text: string, audioData: number[]) => void;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const initializeAudio = useCallback(() => {
    if (!audioContext) {
      const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(newAudioContext);

      const newAnalyser = newAudioContext.createAnalyser();
      newAnalyser.fftSize = 256;
      setAnalyser(newAnalyser);

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const source = newAudioContext.createMediaStreamSource(stream);
          source.connect(newAnalyser);
        })
        .catch(err => console.error('Error accessing microphone:', err));
    }
  }, [audioContext]);

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

        if (analyser) {
          const frequencyData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(frequencyData);
          onTranscript(transcript, Array.from(frequencyData));
        } else {
          onTranscript(transcript, []);
        }
      };

      setRecognition(recognition);
    }
  }, [onTranscript, analyser]);

  const startListening = () => {
    if (recognition) {
      initializeAudio();
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