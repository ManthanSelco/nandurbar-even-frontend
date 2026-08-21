# Participant final flow

## Registration

Marathi is the default language. English, Hindi, Marathi and Gujarati are supported. Registration questions are loaded from the backend and translated at request time; selectable question options keep a stable English value while displaying the translated label.

## Profile

The registration profile contains name, gender, mobile, place, organisation/enterprise type, organisation name and sector.

## Post-event

The admin participant profile tracks livelihood categories, value-chain interests, support/solution categories, specific provider interest, next actions, useful-at-Mela selections, feedback, assessment status and implementation status.

## Dashboard

Participants can be filtered and grouped by solution. Clicking a solution card applies the corresponding participant filter. Additional filters include organisation type, sector, solution status, assessment status, implementation status and preferred language.

## WhatsApp

Gupshup is the active provider when `WHATSAPP_PROVIDER=gupshup`. The backend sends approved templates, receives Gupshup v2 webhook events, records delivery status and processes the post-event conversation in the participant's saved language.
