
/* --------------------------------------------------
   Water consumption record
-------------------------------------------------- */

export interface WaterRecord {
    id: number;
    consumedMl: number | null;
    measured: boolean;
    notes: string;
    recordDate: string;
    createdAt: string;
}

/* --------------------------------------------------
   Database row (legacy offered_ml column)
-------------------------------------------------- */

export interface WaterDatabaseRow {
    id: number;
    offered_ml: number;
    consumed_ml: number | null;
    measured: number;
    notes: string;
    record_date: string | null;
    created_at: string;
}

/* --------------------------------------------------
   Create water consumption record
-------------------------------------------------- */

export interface CreateWaterInput {
    consumedMl?: number | null;
    measured: boolean;
    notes?: string;
    recordDate: string;
}

/* --------------------------------------------------
   PATCH water consumption record
-------------------------------------------------- */

export type PatchWaterInput = Partial<CreateWaterInput>;

/* --------------------------------------------------
   Daily offered water target
-------------------------------------------------- */

export interface WaterDailyTarget {
    id: number;
    catId: number;
    offeredMl: number;
    recordDate: string;
    createdAt: string;
    updatedAt: string;
}

/* --------------------------------------------------
   Create or update daily offered water target
-------------------------------------------------- */

export interface CreateWaterDailyTargetInput {
    offeredMl: number;
    recordDate: string;
}

/* --------------------------------------------------
   Daily water summary
-------------------------------------------------- */

export interface WaterDailySummary {
    recordDate: string;
    offeredMl: number;
    totalConsumedMl: number;
    remainingMl: number;
    totalRecords: number;
    measuredRecords: number;
}
