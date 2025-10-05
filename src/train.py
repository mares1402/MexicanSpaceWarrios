import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
from torch.utils.data import Dataset, DataLoader

# Configuration
IMAGE_DIR = "img/"
MODEL_SAVE_PATH = "models/autoencoder.pth"
IMG_SIZE = (256, 256)
BATCH_SIZE = 4
EPOCHS = 100
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class EVIImageDataset(Dataset):
    def __init__(self, image_dir, img_size):
        self.image_paths = sorted([
            os.path.join(image_dir, f) 
            for f in os.listdir(image_dir) 
            if f.endswith('.jpg')
        ])
        self.img_size = img_size

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img = Image.open(self.image_paths[idx]).convert('L')
        img = img.resize(self.img_size)
        img = np.array(img) / 255.0
        return torch.tensor(img, dtype=torch.float32).unsqueeze(0)

class Autoencoder(nn.Module):
    def __init__(self):
        super(Autoencoder, self).__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(64, 32, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(32, 16, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(16, 1, 3, stride=2, padding=1, output_padding=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

def main():
    os.makedirs("models", exist_ok=True)
    if not os.path.exists(IMAGE_DIR) or not os.listdir(IMAGE_DIR):
        print("❌ Error: Folder 'img/' is missing or empty. Please add your 25 JPG images.")
        return

    dataset = EVIImageDataset(IMAGE_DIR, IMG_SIZE)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    model = Autoencoder().to(DEVICE)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    print("🚀 Training autoencoder on your satellite images...")
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for batch in dataloader:
            batch = batch.to(DEVICE)
            optimizer.zero_grad()
            recon = model(batch)
            loss = criterion(recon, batch)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        if epoch % 20 == 0 or epoch == EPOCHS - 1:
            print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss/len(dataloader):.6f}")

    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"✅ Model saved to: {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    main()