import {openActorImage, shareActorImage} from "../api/image-popout-api.mjs";
import {actorInfoPopoverController} from "./actor-info-popover-controller.mjs";

export class SR6ActorInfoElement extends HTMLElement {
    connectedCallback() {
        if (this.dataset.initialized === "true") return;
        this.dataset.initialized = "true";

        this.classList.add("sr6-actor-info");
        this.tabIndex = 0;
        this.setAttribute("role", "button");
        this.setAttribute("aria-haspopup", "dialog");
        this.setAttribute("aria-expanded", "false");

        this.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            void this.#togglePopover();
        });

        this.addEventListener("keydown", event => {
            if (!['Enter', ' '].includes(event.key)) return;
            event.preventDefault();
            void this.#togglePopover();
        });
    }

    disconnectedCallback() {
        actorInfoPopoverController.close();
    }

    async #togglePopover() {
        const actor = await fromUuid(this.dataset.actorUuid);
        if (actor?.documentName !== "Actor") {
            ui.notifications.error(game.i18n.format(
                "SR6ENRICHERS.Actor.NotFound",
                {reference: this.dataset.actorUuid}
            ));
            actorInfoPopoverController.close();
            return;
        }

        actorInfoPopoverController.toggle(this, this.#buildContent(actor));
    }

    #buildContent(actor) {
        const content = document.createElement("section");
        content.classList.add("sr6-actor-info-card");

        const heading = document.createElement("h3");
        heading.textContent = actor.name;

        const portraitButton = document.createElement("button");
        portraitButton.type = "button";
        portraitButton.classList.add("sr6-actor-info-portrait-button");
        portraitButton.title = game.i18n.localize("SR6ENRICHERS.Actor.OpenImage");
        portraitButton.addEventListener("click", event => {
            event.stopPropagation();
            void openActorImage(actor);
        });

        const portrait = document.createElement("img");
        portrait.classList.add("sr6-actor-info-portrait");
        portrait.src = actor.img;
        portrait.alt = actor.name;
        portraitButton.append(portrait);

        const actions = document.createElement("div");
        actions.classList.add("sr6-actor-info-actions");

        const openButton = this.#createActionButton(
            "fa-image",
            "SR6ENRICHERS.Actor.OpenImage",
            () => openActorImage(actor)
        );
        actions.append(openButton);

        if (game.user.isGM) {
            const shareButton = this.#createActionButton(
                "fa-eye",
                "SR6ENRICHERS.Actor.ShareImage",
                () => shareActorImage(actor)
            );
            actions.append(shareButton);
        }

        content.append(heading, portraitButton, actions);
        return content;
    }

    #createActionButton(iconClass, labelKey, callback) {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("sr6-actor-info-action");
        button.addEventListener("click", event => {
            event.stopPropagation();
            void callback();
        });

        const icon = document.createElement("i");
        icon.classList.add("fas", iconClass);
        button.append(icon, document.createTextNode(` ${game.i18n.localize(labelKey)}`));
        return button;
    }
}

export function registerActorInfoElement() {
    if (!customElements.get("sr6-actor-info")) {
        customElements.define("sr6-actor-info", SR6ActorInfoElement);
    }
}
