from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import io
import numpy as np
import tensorflow as tf

app = FastAPI()

# Allow CORS for the frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
model = tf.keras.models.load_model("modelo_vegetacion.h5")

@app.post("/predecir")
async def predecir(imagen: UploadFile = File(...)):
    contenido = await imagen.read()
    nparr = np.frombuffer(contenido, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img = cv2.resize(img, (128, 128)) / 255.0
    input_img = np.expand_dims(img, axis=0)
    # The ConvLSTM model expects a 5D tensor: (batch, time, height, width, channels)
    input_img = np.expand_dims(input_img, axis=1) # Add the 'time' dimension

    pred = model.predict(input_img)
    # The model output shape is (1, 128, 128, 3). We need to remove the first dimension.
    # Squeezing removes all dimensions of size 1.
    pred_img = (np.squeeze(pred) * 255).astype(np.uint8)

    _, buffer = cv2.imencode('.jpg', pred_img)
    return StreamingResponse(io.BytesIO(buffer), media_type="image/jpeg")

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
