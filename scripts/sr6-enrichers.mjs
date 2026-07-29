import {assertSupportedSystem} from "./api/system-api.mjs";
import {SR6Enrichers} from "./enrichers/SR6Enrichers.mjs";
import {registerActorInfoElement} from "./elements/actor-info-element.mjs";
import {registerItemInfoElement} from "./elements/item-info-element.mjs";
import {
    onSR6EnricherClick,
    updateMatrixCheckLabels
} from "./enrichers/SR6EnricherEvents.mjs";

const MODULE_ID = "sr6-enrichers";

Hooks.once("init", () => {
    try {
        assertSupportedSystem();
        registerActorInfoElement();
        registerItemInfoElement();
        SR6Enrichers.register();
        console.log(`${MODULE_ID} | Enrichers registered.`);
    } catch (error) {
        console.error(`${MODULE_ID} | Initialization failed.`, error);
    }
});

Hooks.once("ready", () => {
    if (game.system.id !== "shadowrun6-eden") return;
    document.addEventListener("click", onSR6EnricherClick);
});

Hooks.on("renderJournalSheet", (_app, html) => updateMatrixCheckLabels(html));
Hooks.on("renderJournalPageSheet", (_app, html) => updateMatrixCheckLabels(html));
