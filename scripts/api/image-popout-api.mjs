function createImagePopout(document) {
    return new foundry.applications.apps.ImagePopout({
        src: document.img,
        uuid: document.uuid,
        window: {title: document.name}
    });
}

async function openImage(document) {
    const popout = createImagePopout(document);
    await popout.render(true);
    return popout;
}

async function shareImage(document) {
    const popout = createImagePopout(document);
    await popout.shareImage();
}

export function createActorImagePopout(actor) {
    return createImagePopout(actor);
}

export function openActorImage(actor) {
    return openImage(actor);
}

export function shareActorImage(actor) {
    return shareImage(actor);
}

export function createItemImagePopout(item) {
    return createImagePopout(item);
}

export function openItemImage(item) {
    return openImage(item);
}

export function shareItemImage(item) {
    return shareImage(item);
}
