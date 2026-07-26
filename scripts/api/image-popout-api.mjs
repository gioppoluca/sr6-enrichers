export function createActorImagePopout(actor) {
    return new foundry.applications.apps.ImagePopout({
        src: actor.img,
        uuid: actor.uuid,
        window: {title: actor.name}
    });
}

export async function openActorImage(actor) {
    const popout = createActorImagePopout(actor);
    await popout.render(true);
    return popout;
}

export async function shareActorImage(actor) {
    const popout = createActorImagePopout(actor);
    await popout.shareImage();
}
