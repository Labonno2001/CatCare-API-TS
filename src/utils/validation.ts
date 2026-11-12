
// Validate YYYY-MM-DD and reject impossible dates
export const isValidDate = (
    date: unknown
): date is string => {

    if (typeof date !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
};


// Validate a positive integer record ID
export const isValidId = (
    id: string | string[]
): boolean => {

    if (typeof id !== "string" || id.trim() === "") {
        return false;
    }

    const numericId = Number(id);

    return (
        Number.isInteger(numericId) &&
        numericId > 0
    );
};
