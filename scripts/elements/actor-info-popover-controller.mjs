class ActorInfoPopoverController {
    #anchor = null;
    #popover = null;

    constructor() {
        this._onDocumentPointerDown = this._onDocumentPointerDown.bind(this);
        this._onDocumentKeyDown = this._onDocumentKeyDown.bind(this);
        this._updatePosition = this._updatePosition.bind(this);
    }

    toggle(anchor, content) {
        if (this.#anchor === anchor) {
            this.close();
            return;
        }

        this.open(anchor, content);
    }

    open(anchor, content) {
        this.close();

        const popover = document.createElement("div");
        popover.classList.add("sr6-actor-info-popover");
        popover.setAttribute("role", "dialog");
        popover.append(content);
        document.body.append(popover);

        this.#anchor = anchor;
        this.#popover = popover;
        anchor.setAttribute("aria-expanded", "true");

        this._updatePosition();
        document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
        document.addEventListener("keydown", this._onDocumentKeyDown, true);
        window.addEventListener("resize", this._updatePosition, {passive: true});
        window.addEventListener("scroll", this._updatePosition, {passive: true, capture: true});
    }

    close() {
        this.#anchor?.setAttribute("aria-expanded", "false");
        this.#popover?.remove();
        this.#anchor = null;
        this.#popover = null;

        document.removeEventListener("pointerdown", this._onDocumentPointerDown, true);
        document.removeEventListener("keydown", this._onDocumentKeyDown, true);
        window.removeEventListener("resize", this._updatePosition);
        window.removeEventListener("scroll", this._updatePosition, true);
    }

    _onDocumentPointerDown(event) {
        if (this.#anchor?.contains(event.target) || this.#popover?.contains(event.target)) return;
        this.close();
    }

    _onDocumentKeyDown(event) {
        if (event.key !== "Escape") return;
        const anchor = this.#anchor;
        this.close();
        anchor?.focus();
    }

    _updatePosition() {
        if (!this.#anchor || !this.#popover) return;

        const margin = 8;
        const gap = 6;
        const anchorRect = this.#anchor.getBoundingClientRect();
        const popoverRect = this.#popover.getBoundingClientRect();

        let left = anchorRect.left;
        left = Math.min(left, window.innerWidth - popoverRect.width - margin);
        left = Math.max(margin, left);

        let top = anchorRect.bottom + gap;
        if (top + popoverRect.height > window.innerHeight - margin) {
            top = anchorRect.top - popoverRect.height - gap;
        }
        top = Math.max(margin, top);

        this.#popover.style.left = `${left}px`;
        this.#popover.style.top = `${top}px`;
    }
}

export const actorInfoPopoverController = new ActorInfoPopoverController();
