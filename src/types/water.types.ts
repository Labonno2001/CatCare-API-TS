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

export interface CreateWaterInput {
    offeredMl: number;
    consumedMl?: number | null;
    measured: boolean;
    notes?: string;
    recordDate: string;
}