'use client';

import { createThing } from '../actions/actions';


export default function ThingButton() {

    const doClick = () => {
        console.log("doClick clicked");
        createThing();
    }

    return(
        <button onClick={doClick}>BIG BUTTON HERE HEHHE</button>
    )
}

export { ThingButton };