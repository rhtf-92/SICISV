from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://sicisv:sicisv_dev@localhost:5432/sicisv"
    HOST: str = "0.0.0.0"
    PORT: int = 3002
    SIMILARITY_THRESHOLD: float = 0.35

    model_config = {"env_file": ".env"}


settings = Settings()
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
