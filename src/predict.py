import os
import numpy as np
import torch
from PIL import Image
from src.train import Autoencoder
import matplotlib.pyplot as plt

IMAGE_DIR = "public/imgs"
MODEL_PATH = "models/autoencoder.pth"
OUTPUT_IMAGE = "outputs/prediction_future.jpg"
COMPARISON_IMAGE = "outputs/comparison.png"
IMG_SIZE = (4096, 2048)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_images(image_dir, img_size):
    paths = sorted([
        os.path.join(image_dir, f) 
        for f in os.listdir(image_dir) 
        if f.endswith('.jpg')
    ])
    images = []
    for p in paths:
        img = Image.open(p).convert('L').resize(img_size)
        images.append(np.array(img) / 255.0)
    return np.array(images), paths

def main():
    os.makedirs("outputs", exist_ok=True)
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Error: Model not found. Run 'python src/train.py' first.")
        return

    images, paths = load_images(IMAGE_DIR, IMG_SIZE)
    if len(images) < 2:
        print("❌ Error: At least 2 images are required in 'img/'.")
        return

    model = Autoencoder().to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()

    # Extract latent representations
    latents = []
    with torch.no_grad():
        for img in images:
            tensor = torch.tensor(img, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(DEVICE)
            latent = model.encoder(tensor)
            latents.append(latent.cpu().numpy())
    latents = np.array(latents)

    # Linear extrapolation into the future
    prev_latent = latents[-2]
    last_latent = latents[-1]
    future_latent = last_latent + (last_latent - prev_latent) * 0.6  # 60% beyond last point

    # Decode future latent
    with torch.no_grad():
        future_tensor = torch.tensor(future_latent, dtype=torch.float32).to(DEVICE)
        pred = model.decoder(future_tensor).squeeze().cpu().numpy()

    # Save prediction
    pred_clipped = np.clip(pred, 0, 1)
    pred_img = Image.fromarray((pred_clipped * 255).astype(np.uint8))
    pred_img.save(OUTPUT_IMAGE)
    print(f"✅ Prediction saved: {OUTPUT_IMAGE}")

    # Save comparison
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.imshow(images[-1], cmap='gray')
    plt.title("Last Real Image", fontsize=12)
    plt.axis('off')

    plt.subplot(1, 2, 2)
    plt.imshow(pred_clipped, cmap='gray')
    plt.title("Predicted Future Image", fontsize=12)
    plt.axis('off')

    plt.tight_layout()
    plt.savefig(COMPARISON_IMAGE, dpi=150)
    print(f"✅ Comparison saved: {COMPARISON_IMAGE}")

if __name__ == "__main__":
    main()