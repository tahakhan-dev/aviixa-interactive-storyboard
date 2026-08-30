// The screen title lives OUTSIDE the `'use client'` screen module on purpose.
// `page.tsx` reads it into `export const metadata`, which is evaluated on the
// server: importing it from a client module makes Next substitute a throwing
// client-reference proxy, and the metadata template literal stringifies that
// proxy into the browser tab. Three Hub pages shipped
// `function(){throw Error("Attempted to call SCREEN_TITLE() from the server …")}`
// as their `<title>` that way. `app/hub/devices` has always held its title in a
// non-client sibling; this is the same shape.
export const SCREEN_TITLE = 'Parts registry'
