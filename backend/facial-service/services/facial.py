import io
import numpy as np
from PIL import Image
from insightface.app import FaceAnalysis
import psycopg2
from psycopg2.extras import RealDictCursor
from config import settings


class FacialService:
    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_l",
            root="~/.insightface/models",
            providers=["CPUExecutionProvider"],
        )
        self.app.prepare(ctx_id=0, det_size=(320, 320))
        self.SIMILARITY_THRESHOLD = settings.SIMILARITY_THRESHOLD

    def _get_embedding(self, image_data: bytes) -> np.ndarray | None:
        try:
            img = Image.open(io.BytesIO(image_data)).convert("RGB")
            img_array = np.array(img)
            faces = self.app.get(img_array)
            if not faces:
                return None
            embedding = faces[0].embedding.astype(np.float32)
            norm = np.linalg.norm(embedding)
            return (embedding / norm) if norm > 0 else None
        except Exception:
            return None

    def _embedding_to_str(self, emb: np.ndarray) -> str:
        return "[" + ",".join(str(round(v, 8)) for v in emb) + "]"

    def extract(self, image_data: bytes) -> dict:
        emb = self._get_embedding(image_data)
        if emb is None:
            return {"success": False, "error": "No face detected in the image"}
        return {"success": True, "embedding": self._embedding_to_str(emb)}

    def store_embedding(self, entry_id: str, image_data: bytes) -> dict:
        result = self.extract(image_data)
        if not result["success"]:
            return result

        conn = psycopg2.connect(settings.DATABASE_URL)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'UPDATE "Entry" SET "driverEmbedding" = %s WHERE "id" = %s',
                    (result["embedding"], entry_id),
                )
            conn.commit()
            return {"success": True, "embedding": result["embedding"]}
        finally:
            conn.close()

    def compare_with_entry(self, entry_id: str, image_data: bytes) -> dict:
        emb_new = self._get_embedding(image_data)
        if emb_new is None:
            return {
                "success": False,
                "match": False,
                "error": "No face detected in the comparison image",
            }

        conn = psycopg2.connect(settings.DATABASE_URL)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'SELECT "driverEmbedding" FROM "Entry" WHERE "id" = %s',
                    (entry_id,),
                )
                row = cur.fetchone()
                if not row or not row["driverEmbedding"]:
                    return {
                        "success": False,
                        "match": False,
                        "error": "Entry not found or no stored embedding",
                    }

                emb_str = self._embedding_to_str(emb_new)
                cur.execute(
                    """
                    SELECT 1 - (%s::vector <=> "driverEmbedding"::vector) AS sim
                    FROM "Entry" WHERE "id" = %s
                    """,
                    (emb_str, entry_id),
                )
                result = cur.fetchone()
                similarity = float(result["sim"]) if result else 0.0
                is_match = similarity >= self.SIMILARITY_THRESHOLD

                return {
                    "success": True,
                    "match": is_match,
                    "confidence": round(similarity, 4),
                    "threshold": self.SIMILARITY_THRESHOLD,
                }
        finally:
            conn.close()

    def compare_two_images(self, image1_data: bytes, image2_data: bytes) -> dict:
        emb1 = self._get_embedding(image1_data)
        emb2 = self._get_embedding(image2_data)

        if emb1 is None or emb2 is None:
            return {
                "success": False,
                "match": False,
                "error": "No face detected in one or both images",
            }

        similarity = float(np.dot(emb1, emb2))
        is_match = similarity >= self.SIMILARITY_THRESHOLD

        return {
            "success": True,
            "match": is_match,
            "confidence": round(similarity, 4),
            "threshold": self.SIMILARITY_THRESHOLD,
        }

    def recognize(self, image_data: bytes) -> dict:
        emb = self._get_embedding(image_data)
        if emb is None:
            return {"success": False, "recognized": False, "error": "No face detected in the image"}

        emb_str = "[" + ",".join(str(round(v, 8)) for v in emb) + "]"

        conn = psycopg2.connect(settings.DATABASE_URL)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, "fullName", "licensePlate", "vehiclePhoto", "driverPhoto",
                           1 - (CAST(%s AS vector) <=> CAST("embedding" AS vector)) AS sim
                    FROM "KnownDriver"
                    WHERE "embedding" IS NOT NULL
                    ORDER BY sim DESC
                    LIMIT 1
                """, (emb_str,))
                row = cur.fetchone()

                if row and row["sim"] > self.SIMILARITY_THRESHOLD:
                    return {
                        "success": True,
                        "recognized": True,
                        "confidence": round(float(row["sim"]), 4),
                        "profile": {
                            "id": row["id"],
                            "fullName": row["fullName"],
                            "licensePlate": row["licensePlate"],
                            "vehiclePhoto": row["vehiclePhoto"],
                            "driverPhoto": row["driverPhoto"],
                        },
                    }
                return {"success": True, "recognized": False, "confidence": 0.0, "profile": None}
        finally:
            conn.close()

    def register_profile(self, full_name: str | None, license_plate: str, vehicle_photo: str,
                          driver_photo: str, image_data: bytes) -> dict:
        emb = self._get_embedding(image_data)
        if emb is None:
            return {"success": False, "error": "No face detected in the image"}

        emb_str = "[" + ",".join(str(round(v, 8)) for v in emb) + "]"

        conn = psycopg2.connect(settings.DATABASE_URL)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO "KnownDriver" ("fullName", "licensePlate", "vehiclePhoto",
                                               "driverPhoto", "embedding")
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (full_name, license_plate, vehicle_photo, driver_photo, emb_str))
                row = cur.fetchone()
            conn.commit()
            return {"success": True, "profile_id": row["id"]}
        finally:
            conn.close()
