import {SR6Enricher} from "./SR6Enricher.mjs";

export class ActorInfoEnricher extends SR6Enricher {
    static pattern = /@Actor\(([^)]+)\)(?:\{([^}]+)\})?/gi;

    static async enrich(match, _options) {
        const reference = match[1].trim();
        const actor = await this.#resolveActor(reference);

        if (!actor) return this.#createError(
            game.i18n.format("SR6ENRICHERS.Actor.NotFound", {reference})
        );

        if (Array.isArray(actor)) return this.#createError(
            game.i18n.format("SR6ENRICHERS.Actor.Ambiguous", {reference})
        );

        const element = document.createElement("sr6-actor-info");
        element.dataset.actorUuid = actor.uuid;

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-user");
        const label = match[2]?.trim() || actor.name;
        element.append(icon, document.createTextNode(` ${label}`));
        return element;
    }

    static async #resolveActor(reference) {
        if (reference.includes(".")) {
            try {
                const document = await fromUuid(reference);
                return document?.documentName === "Actor" ? document : null;
            } catch (_error) {
                return null;
            }
        }

        const normalized = reference.toLocaleLowerCase(game.i18n.lang);
        const matches = game.actors.filter(
            actor => actor.name.trim().toLocaleLowerCase(game.i18n.lang) === normalized
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
