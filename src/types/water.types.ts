
export interface WaterRecord {
    id: number;
    offeredMl: number;
    consumedMl: number | null;
    measured: boolean;
    notes: string;
    recordDate: string;
    createdAt: string;
}

export interface WaterDatabaseRow {
    id: number;
    offered_ml: number;
    consumed_ml: number | null;
    measured: number;
    notes: string;
    record_date: string | null;
    created_at: string;
}

// Required fields when creating or fully updating a water record
export interface CreateWaterInput {
    offeredMl: number;
    consumedMl?: number | null;
    measured: boolean;
    notes?: string;
    recordDate: string;
}

// Optional fields when partially updating a water record
export type PatchWaterInput = Partial<CreateWaterInput>;
