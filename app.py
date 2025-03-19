from flask import Flask, render_template, request, jsonify
import base64
import io
from PIL import Image
import torch
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

app = Flask(__name__)


# Load pre-trained TrOCR model
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json["image"]

    # Convert base64 to PIL Image
    image_data = base64.b64decode(data.split(",")[1])
    image = Image.open(io.BytesIO(image_data))

    # Ensure image is in RGB format (fixes the error)
    image = image.convert("RGB")

    # Preprocess image
    pixel_values = processor(images=image, return_tensors="pt").pixel_values

    # Generate text prediction
    with torch.no_grad():
        generated_ids = model.generate(pixel_values)
        recognized_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    return jsonify({"recognized_text": recognized_text})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
