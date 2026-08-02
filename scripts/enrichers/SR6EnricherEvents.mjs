const LOG_PREFIX = "SR6E | Enricher";
const LISTENER = Symbol("sr6EnricherListener");

export function activateSR6EnricherListeners(root, handler) {
    if (!(root instanceof Element) || !handler?.action) return;

    const selector = `[data-sr6-enricher-action="${handler.action}"]`;
    const elements = [];

    if (root.matches(selector)) elements.push(root);
    elements.push(...root.querySelectorAll(selector));

    for (const element of elements) {
        if (!(element instanceof HTMLElement)) continue;

        if (element[LISTENER]) {
            element.removeEventListener("click", element[LISTENER]);
        }

        element[LISTENER] = event => onSR6EnricherClick(event, element, handler);
        element.addEventListener("click", element[LISTENER]);
    }
}

async function onSR6EnricherClick(event, element, handler) {
    event.preventDefault();

    try {
        await handler.handle(element, event);
    } catch (error) {
        console.error(
            `${LOG_PREFIX} | Failed to handle action "${handler.action}"`,
            error
        );
    }
}
