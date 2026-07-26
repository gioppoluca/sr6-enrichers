import {ActorRollEnricher} from "./ActorRollEnricher.mjs";
import {MatrixCheckEnricher} from "./matrix/MatrixCheckEnricher.mjs";
import {MatrixAttackEnricher} from "./matrix/MatrixAttackEnricher.mjs";

const ENRICHER_SELECTOR = "[data-sr6-enricher-action]";
const HANDLERS = new Map([
    [ActorRollEnricher.action, ActorRollEnricher],
    [MatrixCheckEnricher.action, MatrixCheckEnricher],
    [MatrixAttackEnricher.action, MatrixAttackEnricher]
]);

export async function onSR6EnricherClick(event) {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) return;

    const element = eventTarget.closest(ENRICHER_SELECTOR);
    if (!(element instanceof HTMLElement)) return;

    const action = element.dataset.sr6EnricherAction;
    const handler = HANDLERS.get(action);

    if (!handler) {
        console.warn(`SR6E | Enricher | Unsupported action "${action}"`);
        return;
    }

    event.preventDefault();

    try {
        await handler.handle(element, event);
    } catch (error) {
        console.error(`SR6E | Enricher | Failed to handle action "${action}"`, error);
    }
}

export function updateMatrixCheckLabels(html) {
    MatrixCheckEnricher.updateLabels(html);
}
