import {activateSR6EnricherListeners} from "./SR6EnricherEvents.mjs";

const LOG_PREFIX = "SR6E | Enricher";

export class SR6Enricher {
    static pattern = null;
    static action = null;

    static register() {
        if (!(this.pattern instanceof RegExp)) {
            throw new Error(`${this.name} must define a pattern`);
        }

        if (!Array.isArray(CONFIG.TextEditor?.enrichers)) {
            throw new Error("CONFIG.TextEditor.enrichers is not available");
        }

        const alreadyRegistered = CONFIG.TextEditor.enrichers.some(
            config => config.sr6Enricher === this.name
        );
        if (alreadyRegistered) {
            console.log(`${LOG_PREFIX} | ${this.name} already registered.`);
            return false;
        }

        CONFIG.TextEditor.enrichers.push({
            id: `sr6-enrichers-${this.name}`,
            pattern: this.pattern,
            enricher: async (match, options) => {
                console.log(`${LOG_PREFIX} | ${this.name} matched`, match[0]);
                return this.enrich(match, options);
            },
            onRender: root => {
                if (this.action) activateSR6EnricherListeners(root, this);
                void this.onRender(root);
            },
            sr6Enricher: this.name
        });

        console.log(
            `${LOG_PREFIX} | Registered ${this.name}: /${this.pattern.source}/${this.pattern.flags}`
        );
        return true;
    }

    static isRegistered() {
        return Array.isArray(CONFIG.TextEditor?.enrichers)
            && CONFIG.TextEditor.enrichers.some(config => config.sr6Enricher === this.name);
    }

    static async enrich(_match, _options) {
        throw new Error(`${this.name}.enrich must be implemented`);
    }

    static async handle(_element, _event) {
        throw new Error(`${this.name}.handle must be implemented`);
    }

    static async onRender(_root) {}

    static createInvalidEnricher(source) {
        const span = document.createElement("span");
        span.textContent = source;
        return span;
    }

    static async resolveRollActors() {
        const controlledTokens = canvas.tokens?.controlled ?? [];

        if (controlledTokens.length) {
            const actors = controlledTokens
                .map(token => token.actor)
                .filter(actor => actor?.isOwner);

            if (!actors.length) {
                ui.notifications.warn(
                    "shadowrun6.ui.notifications.You_are_not_owner_of_the_tokens",
                    {localize: true}
                );
                return [];
            }

            return this.uniqueActors(actors);
        }

        if (game.user.isGM) return this.selectSceneActors();

        const character = game.user.character;
        if (character?.isOwner) return [character];

        ui.notifications.warn(
            "shadowrun6.ui.notifications.No_actor_or_tokens_selected",
            {localize: true}
        );
        return [];
    }

    static uniqueActors(actors) {
        return Array.from(
            new Map(actors.map(actor => [actor.uuid, actor])).values()
        );
    }

    static async selectSceneActors() {
        const actors = this.uniqueActors(
            (canvas.tokens?.placeables ?? [])
                .map(token => token.actor)
                .filter(Boolean)
        ).sort((left, right) => {
            const leftIsPlayer = left.type === "Player";
            const rightIsPlayer = right.type === "Player";

            if (leftIsPlayer !== rightIsPlayer) return leftIsPlayer ? -1 : 1;
            return left.name.localeCompare(right.name, game.i18n.lang);
        });

        if (!actors.length) {
            ui.notifications.warn(
                "shadowrun6.ui.notifications.No_actor_or_tokens_selected",
                {localize: true}
            );
            return [];
        }

        const content = document.createElement("div");
        content.classList.add("standard-form", "sr6-enricher-dialog");

        for (const actor of actors) {
            const field = document.createElement("label");
            field.classList.add("form-group");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "actor";
            checkbox.value = actor.uuid;

            const name = document.createElement("span");
            name.textContent = actor.name;

            field.append(checkbox, name);
            content.append(field);
        }

        console.log(`${LOG_PREFIX} | Opening GM Actor selector with ${actors.length} actors.`);

        const selectedUuids = await foundry.applications.api.DialogV2.wait({
            window: {title: "Select Actors"},
            content: content.outerHTML,
            buttons: [
                {
                    action: "roll",
                    label: game.i18n.localize("Roll"),
                    icon: "fas fa-dice-d6",
                    default: true,
                    callback: (_event, button) => Array.from(
                        button.form.querySelectorAll('input[name="actor"]:checked')
                    ).map(input => input.value)
                },
                {
                    action: "cancel",
                    label: game.i18n.localize("Cancel")
                }
            ],
            close: () => null
        });

        if (!Array.isArray(selectedUuids) || !selectedUuids.length) return [];

        const actorsByUuid = new Map(actors.map(actor => [actor.uuid, actor]));
        return selectedUuids
            .map(uuid => actorsByUuid.get(uuid))
            .filter(Boolean);
    }

}
