# Internal blind-rating packet

`internal-rating-packet.json` contains 120 response pairs and two mirrored presentation forms. The public packet omits model identifiers, roles, revisions, raw artifact identifiers, and the `presented_new_on_left` mapping.

Each form presents every pair exactly once. Across the two forms, every scenario appears once with the new response on the left and once on the right. Within each form, placement is balanced 60 / 60. The separately retained role key is excluded from Git and committed only by its SHA-256 value.

This packet uses the single-seed 4-bit full-corpus rehearsal. It exists to test the rating interface and collection procedure; judgments collected from it are not eligible for a capability, compatibility, or Experience Delta result.

The interface records pointwise rubric assessments before revealing the pair, then records a side-relative five-level preference. It exports a blinded internal-session file and never calculates aggregate preference.
