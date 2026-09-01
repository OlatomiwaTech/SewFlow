export type MeasurementUnit = "CM" | "INCH";

export interface Measurement {
  id: string;
  customerId: string;
  unit: MeasurementUnit;
  neck: number | null;
  shoulder: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  sleeve: number | null;
  shirtLength: number | null;
  trouserLength: number | null;
  thigh: number | null;
  knee: number | null;
  ankle: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeasurementInput {
  unit?: MeasurementUnit;
  neck?: number | null;
  shoulder?: number | null;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  sleeve?: number | null;
  shirtLength?: number | null;
  trouserLength?: number | null;
  thigh?: number | null;
  knee?: number | null;
  ankle?: number | null;
  notes?: string | null;
}

export type UpdateMeasurementInput = Partial<CreateMeasurementInput>;

export interface MeasurementListResponse {
  success: boolean;
  data: Measurement[];
}
