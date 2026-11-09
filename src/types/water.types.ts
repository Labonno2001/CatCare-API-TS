
export interface WaterRecord {
    id: number;
    offeredMl: number;
    consumedMl: number | null;
    measured: boolean;
    notes: string;
    createdAt: string;
}

export interface WaterDatabaseRow {
    id: number;
    offered_ml: number;
    consumed_ml: number | null;
    measured: number;
    notes: string;
    created_at: string;
}

export interface CreateWaterInput {
    offeredMl: number;
    consumedMl?: number | null;
    measured: boolean;
    notes?: string;
}
