const SYSTEM_ID = "shadowrun6-eden";
const ROLL_TYPES_PATH = `/systems/${SYSTEM_ID}/module/dice/RollTypes.js`;

let rollTypesPromise;

export function assertSupportedSystem() {
    if (game.system.id !== SYSTEM_ID) {
        throw new Error(`SR6 Enrichers requires the ${SYSTEM_ID} system.`);
    }
}

export async function getRollTypes() {
    assertSupportedSystem();
    rollTypesPromise ??= import(ROLL_TYPES_PATH);
    return rollTypesPromise;
}
