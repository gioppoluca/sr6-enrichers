import {openItemImage, shareItemImage} from "../api/image-popout-api.mjs";
import {actorInfoPopoverController} from "./actor-info-popover-controller.mjs";

export class SR6ItemInfoElement extends HTMLElement {
    connectedCallback() {
        if (this.dataset.initialized === "true") return;
        this.dataset.initialized = "true";

        this.classList.add("sr6-item-info");
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
            if (!["Enter", " "].includes(event.key)) return;
            event.preventDefault();
            void this.#togglePopover();
        });
    }

    disconnectedCallback() {
        actorInfoPopoverController.close();
    }

    async #togglePopover() {
        const item = await fromUuid(this.dataset.itemUuid);
        if (item?.documentName !== "Item") {
            ui.notifications.error(game.i18n.format(
                "SR6ENRICHERS.Item.NotFound",
                {reference: this.dataset.itemUuid}
            ));
            actorInfoPopoverController.close();
            return;
        }

        actorInfoPopoverController.toggle(this, await this.#buildContent(item));
    }

    async #buildContent(item) {
        const content = document.createElement("section");
        content.classList.add("sr6-item-info-card");

        const heading = document.createElement("h3");
        heading.textContent = item.name;

        const portraitButton = document.createElement("button");
        portraitButton.type = "button";
        portraitButton.classList.add("sr6-item-info-portrait-button");
        portraitButton.title = game.i18n.localize("SR6ENRICHERS.Item.OpenImage");
        portraitButton.addEventListener("click", event => {
            event.stopPropagation();
            void openItemImage(item);
        });

        const portrait = document.createElement("img");
        portrait.classList.add("sr6-item-info-portrait");
        portrait.src = item.img;
        portrait.alt = item.name;
        portraitButton.append(portrait);

        const actions = document.createElement("div");
        actions.classList.add("sr6-item-info-actions");

        actions.append(this.#createActionButton(
            "fa-image",
            "SR6ENRICHERS.Item.OpenImage",
            () => openItemImage(item)
        ));

        if (game.user.isGM) {
            actions.append(this.#createActionButton(
                "fa-eye",
                "SR6ENRICHERS.Item.ShareImage",
                () => shareItemImage(item)
            ));
        }

        const description = document.createElement("div");
        description.classList.add("sr6-item-info-description");

        const rawDescription = typeof item.system?.description === "string"
            ? item.system.description.trim()
            : "";
        if (rawDescription) {
            description.innerHTML = await TextEditor.enrichHTML(rawDescription, {async: true});
        } else {
            const empty = document.createElement("em");
            empty.textContent = game.i18n.localize("SR6ENRICHERS.Item.NoDescription");
            description.append(empty);
        }

        content.append(heading, portraitButton, actions, description);
        return content;
    }

    #createActionButton(iconClass, labelKey, callback) {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("sr6-item-info-action");
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

export function registerItemInfoElement() {
    if (!customElements.get("sr6-item-info")) {
        customElements.define("sr6-item-info", SR6ItemInfoElement);
    }
}
