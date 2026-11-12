
import { getCatProfile } from "../services/cat.service";
import { getFeedingSummary } from "../services/feeding.service";
import { getWaterSummary } from "../services/water.service";

export const getDailyWellness = (date: string) => {
    // 1. Get cat profile
    const cat = getCatProfile();

    if (!cat) {
        return null;
    }

    // 2. Reuse the feeding summary service
    const feedingSummary = getFeedingSummary(date);

    // 3. Reuse the water summary service
    const waterSummary = getWaterSummary(date);

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
