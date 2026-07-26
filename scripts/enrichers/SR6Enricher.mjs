const LOG_PREFIX = "SR6E | Enricher";

export class SR6Enricher {
    static pattern = null;
    static action = null;

    static register() {
        if (!(this.pattern instanceof RegExp)) {
            throw new Error(`${this.name} must define a pattern`);
        }

        const alreadyRegistered = CONFIG.TextEditor.enrichers.some(
            config => config.pattern?.source === this.pattern.source
                && config.pattern?.flags === this.pattern.flags
        );
        if (alreadyRegistered) {
            this.warn(`Pattern already registered for ${this.name}; skipping duplicate.`);
            return;
        }

        CONFIG.TextEditor.enrichers.push({
            pattern: this.pattern,
            enricher: this.enrich.bind(this)
        });
    }

    static async enrich(_match, _options) {
        throw new Error(`${this.name}.enrich must be implemented`);
    }

    static async handle(_element, _event) {
        throw new Error(`${this.name}.handle must be implemented`);
    }

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

            return SR6Enricher.#uniqueActors(actors);
        }

        if (game.user.isGM) return SR6Enricher.#selectSceneActors();

        const character = game.user.character;
        if (character?.isOwner) return [character];

        ui.notifications.warn(
            "shadowrun6.ui.notifications.No_actor_or_tokens_selected",
            {localize: true}
        );
        return [];
    }

    static #uniqueActors(actors) {
        return Array.from(
            new Map(actors.map(actor => [actor.uuid, actor])).values()
        );
    }

    static async #selectSceneActors() {
        const actors = SR6Enricher.#uniqueActors(
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
        content.classList.add("standard-form");

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

        const selectedUuids = foundry.applications?.api?.DialogV2
            ? await foundry.applications.api.DialogV2.wait({
                window: {title: "Select Actors"},
                content,
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
            })
            : await new Promise(resolve => {
                new Dialog({
                    title: "Select Actors",
                    content: content.outerHTML,
                    buttons: {
                        roll: {
                            label: game.i18n.localize("Roll"),
                            icon: '<i class="fas fa-dice-d6"></i>',
                            callback: html => resolve(Array.from(
                                html[0].querySelectorAll('input[name="actor"]:checked')
                            ).map(input => input.value))
                        },
                        cancel: {
                            label: game.i18n.localize("Cancel"),
                            callback: () => resolve(null)
                        }
                    },
                    default: "roll",
                    close: () => resolve(null)
                }).render(true);
            });

        if (!Array.isArray(selectedUuids) || !selectedUuids.length) return [];

        const actorsByUuid = new Map(actors.map(actor => [actor.uuid, actor]));
        return selectedUuids
            .map(uuid => actorsByUuid.get(uuid))
            .filter(Boolean);
    }

    static warn(message, ...data) {
        console.warn(`${LOG_PREFIX} | ${message}`, ...data);
    }
}
