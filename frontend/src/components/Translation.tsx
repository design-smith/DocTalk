import React from 'react';

interface TranslationProps {
  text: string;
  onTranslated: (translatedText: string) => void;
}

const Translation: React.FC<TranslationProps> = ({ text, onTranslated }) => {
  React.useEffect(() => {
    const translateText = async () => {
      if (text) {
        try {
          const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`);
          const data = await response.json();
          if (data.responseStatus === 200) {
            onTranslated(data.responseData.translatedText);
          } else {
            console.error('Translation failed:', data.responseStatus);
            onTranslated('Translation failed');
          }
        } catch (error) {
          console.error('Error during translation:', error);
          onTranslated('Error during translation');
        }
      }
    };

    translateText();
  }, [text, onTranslated]);

  return null; // This component doesn't render anything
};

export default Translation;