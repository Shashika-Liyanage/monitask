from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import base64
from io import BytesIO
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")
class Frame(BaseModel):
    image: str

@app.post("/detect-item")
def detect_item(frame: Frame):
    try:
        # Extract image data
        image_data = frame.image.split(",")[1]
        decoded = base64.b64decode(image_data)
        img = Image.open(BytesIO(decoded))

        results = model.predict(img)

        if len(results[0].boxes) > 0:
            cls = int(results[0].boxes.cls[0])
            item_name = results[0].names[cls]
        else:
            item_name = "No item detected"

        return {"item": item_name}
    except:
        return {"item": "Error processing image"}
