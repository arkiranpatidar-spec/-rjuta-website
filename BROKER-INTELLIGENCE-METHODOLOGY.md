# RJUTA Broker Intelligence — V1 methodology

## Product decision

V1 is a regulatory-identity tool, not a broker rating. A Haryana RERA record can establish that an identity and registration appear in an official register; it cannot establish honesty, competence, deal volume, specialization, negotiation ability, customer satisfaction, or suitability for a transaction.

## Sources inspected

1. Haryana RERA registered agents, Gurugram: <https://haryanarera.gov.in/admincontrol/registered_agents/2>
2. Haryana RERA revoked/cancelled agents, Gurugram: <https://haryanarera.gov.in/admincontrol/cancelled_agents/2>
3. Gurugram agent certificates: <https://hareraggm.gov.in/app/Agent_signup/Registered_certificate>
4. Haryana RERA terms of use: <https://haryanarera.gov.in/login/terms_of_use>

The registered-agent table exposes registration number, name, district, category, issue date, expiry date and a certificate link. The certificate directory supplies a second official certificate reference. The public Gurugram revoked/cancelled table returned no rows in the 10 September 2026 snapshot. That is a source limitation, not evidence that no adverse regulatory events exist.

## Normalization and status logic

Registration numbers are preserved verbatim and also normalized by uppercasing and removing punctuation and whitespace. Records are matched to the revoked snapshot using that normalized value. Status precedence is:

1. `REVOKED/CANCELLED` when a normalized registration number appears in the official revoked snapshot.
2. `EXPIRED` when the displayed certificate expiry date precedes the verification date.
3. `ACTIVE` internally when a usable future expiry exists and no revoked-list match is found. The interface deliberately translates this to “Within displayed validity period,” avoiding a broader trust claim.
4. `STATUS_UNCERTAIN` for duplicate registration numbers or missing/unusable expiry dates.

The 10 September 2026 build contains 4,832 rows: 3,427 within the displayed validity period, 1,370 expired, and 35 uncertain. No rows matched the empty revoked snapshot.

## Provenance and minimization

Core regulatory fields are labelled Government Verified. Specialization and customer-experience fields are labelled Insufficient Evidence; transactions are Not Independently Verified. The public data layer omits phone numbers, personal email addresses, addresses, transaction claims and inferred specializations. Each passport links to its official source and certificate where available.

## Update process

`node scripts/update-brokers.mjs` processes saved snapshots. `node scripts/update-brokers.mjs --live` retrieves the three official pages and rewrites `data/brokers.json`. The GitHub workflow is manual-only and commits only when the normalized output changes.

Haryana RERA's published terms state that portal material may be reproduced after permission. Therefore a daily schedule and publication of the complete register should remain disabled until RJUTA has written permission. Do not bypass CAPTCHAs, access controls, or technical restrictions.

## Quality limits and next controls

- Absence from a snapshot is not proof that a person is unregistered.
- A future expiry date is not conclusive evidence that no later adverse order exists.
- Duplicate names can represent different people; the registration number is the primary identity key.
- Historical changes are not yet retained as a longitudinal table.
- Before production, obtain permission, add update-failure alerts, retain immutable dated snapshots, review revoked orders beyond the empty list page, and add a user-visible correction channel.
