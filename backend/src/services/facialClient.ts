const FACIAL_SERVICE_URL = process.env.FACIAL_SERVICE_URL || 'http://localhost:3002';

export class FacialClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || FACIAL_SERVICE_URL;
  }

  async storeEmbedding(entryId: string, imageBase64: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${this.baseUrl}/api/facial/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId, image: imageBase64 }),
    });
    const data: any = await res.json();
    if (!res.ok) return { success: false, error: data.detail || 'Facial service error' };
    return data;
  }

  async compareFace(entryId: string, imageBase64: string): Promise<{
    success: boolean;
    match?: boolean;
    confidence?: number;
    error?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/api/facial/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId, image: imageBase64 }),
    });
    const data: any = await res.json();
    if (!res.ok) return { success: false, error: data.detail || 'Facial service error' };
    return data;
  }

  async registerProfile(data: {
    image: string;
    full_name?: string;
    license_plate: string;
    vehicle_photo: string;
    driver_photo: string;
  }): Promise<{ success: boolean; profile_id?: string; error?: string }> {
    const res = await fetch(`${this.baseUrl}/api/facial/register-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: any = await res.json();
    if (!res.ok) return { success: false, error: result.detail || 'Facial service error' };
    return result;
  }
}
