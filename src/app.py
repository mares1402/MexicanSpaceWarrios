import streamlit as st
import os
from PIL import Image

st.set_page_config(
    page_title="Mexican Space Warriors 🌍",
    layout="centered",
    initial_sidebar_state="collapsed"
)

st.title("🌍 Mexican Space Warriors")
st.subheader("Satellite Vegetation Prediction")

st.markdown("""
This tool uses your **25 historical EVI images (2000–2024)** to generate a simulated future view of Earth's vegetation using a lightweight neural network.
""")

COMPARISON_IMG_PATH = "outputs/comparison.png"
PREDICTION_IMG_PATH = "outputs/prediction_future.jpg"

# Display prediction if available
if os.path.exists(COMPARISON_IMG_PATH):
    st.image(COMPARISON_IMG_PATH, use_column_width=True)
elif os.path.exists(PREDICTION_IMG_PATH):
    st.image(PREDICTION_IMG_PATH, caption="Future Prediction", use_column_width=True)
else:
    st.warning("⚠️ No prediction found.\n\nPlease run in terminal:\n\n"
               "```bash\n"
               "# From the project root directory\n"
               "python -m src.train\n"
               "python -m src.predict\n"
               "```")

st.markdown("---")
st.caption("Satellite Data Visualization Project • MexicanSpaceWarrios")