
import db from "../database/database";
import { getCatProfile } from "../services/cat.service";

export const getDailyWellness = (date: string) => {
    // 1. Get cat profile
    const cat = getCatProfile();

    if (!cat) {
        return null;
    }

    // 2. Get daily feeding summary
    const feedingSummary = db.prepare(`
        SELECT
            COUNT(*) AS totalRecords,
            COALESCE(SUM(quantity_grams), 0) AS totalGrams
        FROM feeding_records
        WHERE substr(created_at, 1, 10) = ?
    `).get(date) as {
        totalRecords: number;
        totalGrams: number;
    };

    // 3. Get daily water summary
    const waterSummary = db.prepare(`
        SELECT
            COUNT(*) AS totalRecords,
            COALESCE(SUM(offered_ml), 0) AS totalOfferedMl,
            COALESCE(SUM(
                CASE WHEN measured = 1 THEN 1 ELSE 0 END
            ), 0) AS measuredConsumptionRecords,
            COALESCE(SUM(
                CASE WHEN measured = 1 THEN consumed_ml ELSE 0 END
            ), 0) AS totalMeasuredConsumedMl
        FROM water_records
        WHERE substr(created_at, 1, 10) = ?
    `).get(date) as {
        totalRecords: number;
        totalOfferedMl: number;
        measuredConsumptionRecords: number;
        totalMeasuredConsumedMl: number;
    };

    // 4. Return combined daily wellness data
    return {
        date,
        cat: {
            id: cat.id,
            name: cat.name,
            age: cat.age,
            weightKg: cat.weightKg
        },
        feeding: feedingSummary,
        water: waterSummary
    };
};
