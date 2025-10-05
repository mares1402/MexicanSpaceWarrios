import os
# Suprimir los mensajes informativos y de advertencia de TensorFlow.
# '1' = suprime INFO, '2' = suprime INFO y WARNING, '3' = suprime INFO, WARNING, y ERROR.
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import ConvLSTM2D, BatchNormalization, Conv2D, TimeDistributed
import cv2
import numpy as np

print("--- Iniciando el pre-procesamiento de imágenes ---")

# --- 1. Cargar y procesar imágenes (de image_preprocessing.py) ---
imagenes = []
num_imagenes = 25 # De 2000 a 2024

for i in range(num_imagenes):
    year = 2000 + i
    # Construimos la ruta absoluta para evitar problemas de ejecución desde diferentes directorios.
    # os.path.dirname(__file__) obtiene la carpeta del script actual ('simulator').
    path = os.path.join(os.path.dirname(__file__), '..', 'imgs_modis', f'modis-{year}.jpg')
    
    if not os.path.exists(path):
        print(f"ADVERTENCIA: No se encontró la imagen para el año {year} en la ruta: {path}")
        continue

    img = cv2.imread(path, cv2.IMREAD_COLOR)
    img = cv2.resize(img, (128, 128))
    img = img / 255.0
    imagenes.append(img)

imagenes = np.array(imagenes)
print(f"Se cargaron {len(imagenes)} imágenes. Forma del array: {imagenes.shape}")

# --- 2. Preparar los datos para el entrenamiento (de prepare_training_data.py) ---
print("\n--- Preparando los datos para el entrenamiento ---")
X = imagenes[:-1]  # Años 0 al 23
Y = imagenes[1:]   # Años 1 al 24

# Expandir dimensiones para el formato que espera ConvLSTM (batch, time, height, width, channels)
X = np.expand_dims(X, axis=1)
Y = np.expand_dims(Y, axis=1)
print(f"Forma de los datos de entrada (X): {X.shape}")
print(f"Forma de los datos de salida (Y): {Y.shape}")

# --- 3. Definir y entrenar el modelo (de train_model.py) ---
print("\n--- Definiendo y entrenando el modelo ---")
model = Sequential([
    # return_sequences=True es crucial para que la salida mantenga la dimensión de tiempo y coincida con Y.
    # Con pocos datos, empezar con menos filtros puede ayudar a prevenir el sobreajuste.
    ConvLSTM2D(filters=32, kernel_size=(3, 3), padding='same', return_sequences=True, activation='relu', input_shape=(1, 128, 128, 3)),
    BatchNormalization(),
    # TimeDistributed aplica una capa (Conv2D en este caso) a cada paso de tiempo de una secuencia.
    # Esto asegura que la forma de la salida del modelo sea (None, 1, 128, 128, 3).
    TimeDistributed(Conv2D(filters=3, kernel_size=(3, 3), activation='sigmoid', padding='same'))
])

model.compile(optimizer='adam', loss='mse', metrics=['mae']) # Añadir 'mean_absolute_error' como otra métrica es útil.

print("\n--- Iniciando entrenamiento ---")
model.fit(X, Y, epochs=50, batch_size=4, validation_split=0.2) # Aumentar epochs y usar un set de validación.

print("\n--- Evaluando el modelo entrenado ---")
loss = model.evaluate(X, Y, verbose=0)
print(f"Pérdida final del modelo (MSE): {loss:.6f}")
print("(Un valor de pérdida más bajo indica un mejor rendimiento)")

print("\n--- Guardando el modelo entrenado en 'modelo_vegetacion.h5' ---")
model.save("modelo_vegetacion.h5")
print("✅ ¡Modelo guardado con éxito!")