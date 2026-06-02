import { api } from './api';

export interface RecognizedProfile {
  id: string;
  fullName: string | null;
  licensePlate: string;
  vehiclePhoto: string;
  driverPhoto: string;
}

interface RecognizeResponse {
  success: boolean;
  recognized: boolean;
  confidence: number;
  profile: RecognizedProfile | null;
}

export const facialApi = {
  recognize: (image: string) =>
    api.post<RecognizeResponse>('/facial/recognize', { image }),
};
