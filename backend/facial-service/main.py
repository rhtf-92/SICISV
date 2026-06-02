import base64
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from services.facial import FacialService


facial_service = FacialService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SICISV Facial Recognition Service",
    description="Facial recognition microservice for SICISV driver verification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractRequest(BaseModel):
    image: str


class StoreEmbeddingRequest(BaseModel):
    entry_id: str
    image: str


class CompareRequest(BaseModel):
    entry_id: str
    image: str


class CompareTwoRequest(BaseModel):
    image1: str
    image2: str


class RecognizeRequest(BaseModel):
    image: str


class RegisterProfileRequest(BaseModel):
    image: str
    full_name: str | None = None
    license_plate: str
    vehicle_photo: str
    driver_photo: str


def decode_image(image_str: str) -> bytes:
    if image_str.startswith("data:image"):
        image_str = image_str.split(",", 1)[1]
    return base64.b64decode(image_str)


@app.post("/api/facial/extract")
async def extract_embedding(req: ExtractRequest):
    try:
        image_data = decode_image(req.image)
        result = facial_service.extract(image_data)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "embedding": result["embedding"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial/store")
async def store_embedding(req: StoreEmbeddingRequest):
    try:
        image_data = decode_image(req.image)
        result = facial_service.store_embedding(req.entry_id, image_data)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "message": "Embedding stored successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial/compare")
async def compare_face(req: CompareRequest):
    try:
        image_data = decode_image(req.image)
        result = facial_service.compare_with_entry(req.entry_id, image_data)
        if not result["success"] and result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial/compare-two")
async def compare_two_faces(req: CompareTwoRequest):
    try:
        image1_data = decode_image(req.image1)
        image2_data = decode_image(req.image2)
        result = facial_service.compare_two_images(image1_data, image2_data)
        if not result["success"] and result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial/recognize")
async def recognize_driver(req: RecognizeRequest):
    try:
        image_data = decode_image(req.image)
        result = facial_service.recognize(image_data)
        if not result["success"] and result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial/register-profile")
async def register_driver_profile(req: RegisterProfileRequest):
    try:
        image_data = decode_image(req.image)
        result = facial_service.register_profile(
            full_name=req.full_name,
            license_plate=req.license_plate,
            vehicle_photo=req.vehicle_photo,
            driver_photo=req.driver_photo,
            image_data=image_data,
        )
        if not result["success"] and result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "facial-recognition"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=False)
