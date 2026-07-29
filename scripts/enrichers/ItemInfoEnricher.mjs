import {SR6Enricher} from "./SR6Enricher.mjs";

export class ItemInfoEnricher extends SR6Enricher {
    static pattern = /@Item\(([^)]+)\)(?:\{([^}]+)\})?/gi;

    static async enrich(match, _options) {
        const reference = match[1].trim();
        const item = await this.#resolveItem(reference);

        if (!item) return this.#createError(
            game.i18n.format("SR6ENRICHERS.Item.NotFound", {reference})
        );

        if (Array.isArray(item)) return this.#createError(
            game.i18n.format("SR6ENRICHERS.Item.Ambiguous", {reference})
        );

        const element = document.createElement("sr6-item-info");
        element.dataset.itemUuid = item.uuid;

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-suitcase");
        const label = match[2]?.trim() || item.name;
        element.append(icon, document.createTextNode(` ${label}`));
        return element;
    }

    static async #resolveItem(reference) {
        if (reference.includes(".")) {
            try {
                const document = await fromUuid(reference);
                if (document?.documentName === "Item") return document;
            } catch (_error) {
                // Fall through and try resolving the reference as an Item name.
            }
        }

        const normalized = reference.toLocaleLowerCase(game.i18n.lang);
        const matches = game.items.filter(
            item => item.name.trim().toLocaleLowerCase(game.i18n.lang) === normalized
        );

        if (matches.length === 1) return matches[0];
        if (matches.length > 1) return matches;
        return null;
    }

    static #createError(message) {
        const span = document.createElement("span");
        span.classList.add("sr6-enricher-error");
        span.title = message;

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-triangle-exclamation");
        span.append(icon, document.createTextNode(` ${message}`));
        return span;
    }
}
