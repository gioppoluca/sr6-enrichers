import {assertSupportedSystem} from "./api/system-api.mjs";
import {SR6Enrichers} from "./enrichers/SR6Enrichers.mjs";
import {registerActorInfoElement} from "./elements/actor-info-element.mjs";
import {registerItemInfoElement} from "./elements/item-info-element.mjs";

const LOG_PREFIX = "SR6E | Enricher";

console.log(`${LOG_PREFIX} | Module script loaded.`);

Hooks.once("init", () => {
    console.log(`${LOG_PREFIX} | Init started.`, {
        system: game.system.id,
        systemVersion: game.system.version,
        foundryVersion: game.version,
        existingEnrichers: CONFIG.TextEditor?.enrichers?.length
    });

    try {
        assertSupportedSystem();
        registerActorInfoElement();
        registerItemInfoElement();

        const registered = SR6Enrichers.register();
        console.log(
            `${LOG_PREFIX} | Init completed: ${registered} enrichers added.`,
            SR6Enrichers.getStatus()
        );
    } catch (error) {
        console.error(`${LOG_PREFIX} | Initialization failed.`, error);
    }
});

Hooks.once("ready", () => {
    if (game.system.id !== "shadowrun6-eden") {
        console.warn(`${LOG_PREFIX} | Ready skipped for unsupported system "${game.system.id}".`);
        return;
    }

    try {
        assertSupportedSystem();

        if (!SR6Enrichers.areRegistered()) {
            console.warn(`${LOG_PREFIX} | One or more enrichers were missing at ready; registering them again.`);
            SR6Enrichers.register();
        }

        console.log(`${LOG_PREFIX} | Ready completed.`, {
            registeredEnrichers: SR6Enrichers.getStatus(),
            totalTextEnrichers: CONFIG.TextEditor.enrichers.length,
            interaction: "onRender"
        });
    } catch (error) {
        console.error(`${LOG_PREFIX} | Ready initialization failed.`, error);
    }
});
