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

# Display prediction if available
if os.path.exists("outputs/comparison.png"):
    st.image("outputs/comparison.png", use_column_width=True)
elif os.path.exists("outputs/prediction_future.jpg"):
    st.image("outputs/prediction_future.jpg", caption="Future Prediction", use_column_width=True)
else:
    st.warning("⚠️ No prediction found.\n\nPlease run in terminal:\n\n"
               "```bash\n"
               "python src/train.py\n"
               "python src/predict.py\n"
               "```")

st.markdown("---")
st.caption("Satellite Data Visualization Project • MexicanSpaceWarrios")