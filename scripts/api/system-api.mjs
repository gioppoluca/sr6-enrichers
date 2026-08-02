const SYSTEM_ID = "shadowrun6-eden";
const MINIMUM_SYSTEM_VERSION = "4.0.0";

export function assertSupportedSystem() {
    if (game.system.id !== SYSTEM_ID) {
        throw new Error(`SR6 Enrichers requires the ${SYSTEM_ID} system.`);
    }

    if (foundry.utils.isNewerVersion(MINIMUM_SYSTEM_VERSION, game.system.version)) {
        throw new Error(`SR6 Enrichers requires ${SYSTEM_ID} ${MINIMUM_SYSTEM_VERSION} or newer.`);
    }
}

export async function getRollTypes() {
    assertSupportedSystem();

    if (!game.sr6?.rollTypes) {
        throw new Error("Shadowrun 6 roll API is not available.");
    }

    return game.sr6.rollTypes;
}
