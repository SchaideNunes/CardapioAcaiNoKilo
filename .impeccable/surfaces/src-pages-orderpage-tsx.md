---
version: 1
slug: "src-pages-orderpage-tsx"
primary_target: "src/pages/OrderPage.tsx"
related_targets: []
---

# Surface: /montar (montagem do açaí)

Mode: Operate. Customers at home on a phone building a custom açaí; must always see the running total; must not feel cluttered nor drift from the home's purple + gold identity. Owner rule: flat 2D language to match the 2D mascot and logo (no depth shadows, glass, or hover elevation). Mascot not used here.

## Direction contract

THESIS: The builder is a run of full-screen stories, one decision per screen, progress as segmented bars and the total always pinned; it refuses the stacked list-card wizard with a sidebar summary.

OWN-WORLD: Flat deep-purple ground #241220 with #2f1729 panels, no shadows, blur, or lift. Gold #F0DF58 owns selection and the primary action as solid fields outlined 2px in ink #120714; cream #F8EEA6 sticker rims around circular ingredient photos; orange #F58220 only for small secondary facts (fees, counts). Bebas Neue display, Raleway text, every control a capsule. Cited exception: the final "Finalizar no WhatsApp" capsule is WhatsApp green #25D366, because that action leaves the app for WhatsApp and the brand colour tells the customer where the order goes.

STORY: The visitor sees one question at a time, taps big stickers, watches the total capsule update, and finishes on a summary of the order and its total before sending to WhatsApp (owner removed the message preview, 14/10/2026).

FIRST VIEWPORT: Segmented progress bars across the top; back button, logo, and gold total capsule in one row; the step heading huge in Bebas; a 2-column grid of large sticker photos (3 columns on multi-choice steps); a fixed bottom bar with a round back button and a gold capsule "Próximo: <next step>".

FORM: stories structure, position 7 of the ordered list, seed f0edae15. Signature move: each progress segment fills gold with a 0.4s overshoot as the visitor advances, and a chosen sticker pops with the same overshoot.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
