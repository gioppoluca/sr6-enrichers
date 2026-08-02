const LOG_PREFIX = "SR6E | Enricher";

import {SR6Enricher} from "../SR6Enricher.mjs";

export class HostEnricher extends SR6Enricher {
    static pattern = /@Host\[([^\]]+)\](?:\{([^}]+)\})?/g;

    static async enrich(match, _options) {
        const host = this.#parseDefinition(match[1]);

        if (!host) {
            console.warn(`${LOG_PREFIX} | Invalid Host definition "${match[1]}"`);
            return this.createInvalidEnricher(match[0]);
        }

        const label = match[2]?.trim() || host.id;
        const span = document.createElement("span");
        span.classList.add("sr6-enricher-host");
        span.dataset.sr6HostId = host.id;
        span.dataset.attack = host.attack;
        span.dataset.sleaze = host.sleaze;
        span.dataset.dataProcessing = host.dataProcessing;
        span.dataset.firewall = host.firewall;
        span.dataset.hostLabel = label;
        span.dataset.tooltip = `A ${host.attack} / S ${host.sleaze} / D ${host.dataProcessing} / F ${host.firewall}`;

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-server");
        span.append(icon, document.createTextNode(` ${label}`));
        return span;
    }

    static async resolve(element, hostReference) {
        const actorResolution = await this.#resolveActorHost(hostReference);
        if (actorResolution.resolved) return actorResolution.host;
        if (actorResolution.stop) return null;

        return this.#resolveInlineHost(element, hostReference);
    }

    static async #resolveActorHost(hostReference) {
        const reference = hostReference.trim();
        if (!reference) return {resolved: false, stop: false, host: null};

        if (this.#looksLikeUuid(reference)) {
            let document;

            try {
                document = await fromUuid(reference);
            } catch (error) {
                console.warn(`${LOG_PREFIX} | Failed to resolve Host Actor UUID "${reference}".`, error);
                return {resolved: false, stop: true, host: null};
            }

            if (document?.documentName !== "Actor" || document.type !== "host") {
                console.warn(`${LOG_PREFIX} | UUID "${reference}" does not resolve to a Host Actor.`);
                return {resolved: false, stop: true, host: null};
            }

            const host = this.#fromActor(document);
            console.log(`${LOG_PREFIX} | Resolved Host Actor by UUID: ${reference}`);
            return {resolved: Boolean(host), stop: true, host};
        }

        const matches = game.actors.filter(actor => {
            if (actor.type !== "host") return false;
            const sourceName = actor._source?.name ?? actor.name;
            return sourceName === reference || actor.name === reference;
        });

        if (matches.length > 1) {
            console.warn(
                `${LOG_PREFIX} | Multiple Host Actors named "${reference}" were found; use an Actor UUID.`
            );
            return {resolved: false, stop: true, host: null};
        }

        if (matches.length === 1) {
            const host = this.#fromActor(matches[0]);
            console.log(`${LOG_PREFIX} | Resolved Host Actor by name: ${reference}`);
            return {resolved: Boolean(host), stop: true, host};
        }

        return {resolved: false, stop: false, host: null};
    }

    static #resolveInlineHost(element, hostReference) {
        const scope = element.closest(
            ".journal-page-content, .journal-entry-content, .editor-content, .window-content"
        );
        if (!scope) return null;

        const normalizedReference = hostReference.trim().toLowerCase();
        const hostElement = Array.from(
            scope.querySelectorAll("[data-sr6-host-id]")
        ).find(candidate => candidate.dataset.sr6HostId === normalizedReference);

        if (!(hostElement instanceof HTMLElement)) return null;

        const host = {
            label: hostElement.dataset.hostLabel || hostReference,
            attack: Number(hostElement.dataset.attack),
            sleaze: Number(hostElement.dataset.sleaze),
            dataProcessing: Number(hostElement.dataset.dataProcessing),
            firewall: Number(hostElement.dataset.firewall)
        };

        if (!Object.values(host).slice(1).every(Number.isFinite)) return null;

        console.log(`${LOG_PREFIX} | Resolved inline Host definition: ${normalizedReference}`);
        return host;
    }

    static #fromActor(actor) {
        const attributes = actor.system?.matrix?.attributes;
        if (!attributes) {
            console.warn(`${LOG_PREFIX} | Host Actor "${actor.name}" has no Matrix attributes.`);
            return null;
        }

        const host = {
            label: actor._source?.name ?? actor.name.replace(/^\/\//, ""),
            attack: Number(attributes.attack),
            sleaze: Number(attributes.sleaze),
            dataProcessing: Number(attributes.dataProcessing),
            firewall: Number(attributes.firewall),
            actor
        };

        return [host.attack, host.sleaze, host.dataProcessing, host.firewall]
            .every(Number.isFinite)
            ? host
            : null;
    }

    static #looksLikeUuid(reference) {
        return /^(?:Actor\.[^.]+|Compendium\..+\.Actor\.[^.]+)$/.test(reference);
    }

    static #parseDefinition(source) {
        const [rawId, ...rawParameters] = source.split("|");
        const id = rawId.trim().toLowerCase();
        if (!/^[a-z0-9-]+$/.test(id)) return null;

        const parameters = this.#parseParameters(rawParameters);
        if (!parameters) return null;

        const attack = this.#parseAttribute(parameters.attack);
        const sleaze = this.#parseAttribute(parameters.sleaze);
        const dataProcessing = this.#parseAttribute(parameters.dataProcessing);
        const firewall = this.#parseAttribute(parameters.firewall);

        if ([attack, sleaze, dataProcessing, firewall].some(value => value === null)) {
            return null;
        }

        return {id, attack, sleaze, dataProcessing, firewall};
    }

    static #parseParameters(rawParameters) {
        const parameters = {};

        for (const rawParameter of rawParameters) {
            const separator = rawParameter.indexOf("=");
            if (separator < 1) return null;

            const key = rawParameter.slice(0, separator).trim();
            const value = rawParameter.slice(separator + 1).trim();
            if (!key || !value || key in parameters) return null;
            parameters[key] = value;
        }

        return parameters;
    }

    static #parseAttribute(value) {
        if (!/^\d+$/.test(value ?? "")) return null;
        return Number(value);
    }
}
