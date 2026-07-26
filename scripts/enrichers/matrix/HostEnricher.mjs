import {SR6Enricher} from "../SR6Enricher.mjs";

export class HostEnricher extends SR6Enricher {
    static pattern = /@Host\[([^\]]+)\](?:\{([^}]+)\})?/g;

    static async enrich(match, _options) {
        const host = this.#parseDefinition(match[1]);

        if (!host) {
            this.warn(`Invalid Host definition "${match[1]}"`);
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

    static resolve(element, hostId) {
        const scope = element.closest(
            ".journal-page-content, .journal-entry-content, .editor-content, .window-content"
        );
        if (!scope) return null;

        const hostElement = Array.from(
            scope.querySelectorAll("[data-sr6-host-id]")
        ).find(candidate => candidate.dataset.sr6HostId === hostId);

        if (!(hostElement instanceof HTMLElement)) return null;

        const host = {
            label: hostElement.dataset.hostLabel || hostId,
            attack: Number(hostElement.dataset.attack),
            sleaze: Number(hostElement.dataset.sleaze),
            dataProcessing: Number(hostElement.dataset.dataProcessing),
            firewall: Number(hostElement.dataset.firewall)
        };

        return Object.values(host).slice(1).every(Number.isFinite) ? host : null;
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
