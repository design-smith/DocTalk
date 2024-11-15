from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from transformers import MarianMTModel, MarianTokenizer
import uvicorn
from typing import Dict
import logging
from time import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Load the model and tokenizer globally
logger.info("Loading model and tokenizer...")
try:
    #model = MarianMTModel.from_pretrained('./checkpoint-2673')
    #tokenizer = MarianTokenizer.from_pretrained('./checkpoint-2673')
    MODEL_NAME = "Helsinki-NLP/opus-mt-en-es"
    model = MarianMTModel.from_pretrained(MODEL_NAME)
    tokenizer = MarianTokenizer.from_pretrained(MODEL_NAME)
    logger.info("Model and tokenizer loaded successfully!")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    raise

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.counter = 0
        self.last_translation_time: Dict[int, float] = {}
        self.current_sentence: Dict[int, str] = {}
        
    async def connect(self, websocket: WebSocket) -> int:
        await websocket.accept()
        self.counter += 1
        self.active_connections[self.counter] = websocket
        self.last_translation_time[self.counter] = 0
        self.current_sentence[self.counter] = ""
        logger.info(f"Client {self.counter} connected. Total connections: {len(self.active_connections)}")
        return self.counter

    def disconnect(self, client_id: int):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            del self.last_translation_time[client_id]
            del self.current_sentence[client_id]
            logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")

    def reset_buffer(self, client_id: int):
        """Reset the current sentence buffer for a client"""
        if client_id in self.current_sentence:
            self.current_sentence[client_id] = ""
            self.last_translation_time[client_id] = time()

    async def send_translation(self, websocket: WebSocket, text: str, client_id: int):
        current_time = time()
        
        # Check if this is a new sentence or continuation
        if len(text) < len(self.current_sentence.get(client_id, "")):
            # If new text is shorter, it's likely a new sentence
            self.reset_buffer(client_id)
        
        self.current_sentence[client_id] = text
        
        # Only translate if:
        # 1. The text ends with a sentence-ending character
        # 2. It's been more than 0.5 seconds since the last translation
        # 3. The text appears to be a complete thought (more than 3 words)
        words = text.split()
        should_translate = (
            text.strip().endswith(('.', '?', '!', '')) or
            (current_time - self.last_translation_time.get(client_id, 0)) > 1 and len(words) > 4
        )
        
        if not should_translate:
            return
            
        try:
            # Update translation time
            self.last_translation_time[client_id] = current_time
            
            # Prepare inputs using the new method
            inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            
            # Generate translation
            translated = model.generate(**inputs)
            translated_text = tokenizer.batch_decode(translated, skip_special_tokens=True)[0]
            
            # Prepare response
            response = {
                "status": "success",
                "translation": translated_text,
                "original": text
            }
            
            # Send translation
            await websocket.send_json(response)
            logger.info(f"Translation sent: '{text}' -> '{translated_text}'")
            
            # Reset buffer after successful translation
            self.reset_buffer(client_id)
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            error_response = {
                "status": "error",
                "error": str(e),
                "original": text
            }
            await websocket.send_json(error_response)

manager = ConnectionManager()

@app.websocket("/ws/translate")
async def websocket_endpoint(websocket: WebSocket):
    client_id = await manager.connect(websocket)
    
    try:
        while True:
            text = await websocket.receive_text()
            
            # Clean up the input text
            text = text.strip()
            logger.info(f"Received text from client {client_id}: {text[:50]}...")
            
            await manager.send_translation(websocket, text, client_id)
            
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected normally")
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Error with client {client_id}: {e}")
        manager.disconnect(client_id)
        try:
            await websocket.close(code=1000)
        except:
            pass

# Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        ws_ping_interval=30,
        ws_ping_timeout=30,
        ws_max_size=10 * 1024 * 1024  # 10MB max message size
    )
    server = uvicorn.Server(config)
    server.run()