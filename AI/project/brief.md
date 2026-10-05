# Project brief — <App name>

<!-- Business truth for agents: WHY the app exists and which rules code must never break.
     Fill at kickoff (AI/playbooks/project-setup.md). Keep under ~80 lines. Unknown → "DECISION NEEDED". -->

## What and why

- **One-line pitch:** <what the app does, for whom>
- **Problem it solves:** <…>
- **Success measures:** <e.g. weekly active users, orders per week, crash-free sessions ≥ 99.5%>

## Users

| User type | Goal   | Platform/device notes                     |
| --------- | ------ | ----------------------------------------- |
| <persona> | <goal> | <e.g. low-end Android, poor connectivity> |

## Scope

- **In (current release):** <features>
- **Out / later:** <features — and why>

## Core business rules

<!-- Rules the code must never violate. Numbered, so reviews can cite them ("breaks BR-2"). -->

1. BR-1 <e.g. an order can be cancelled only before it ships>
2. BR-2 <e.g. prices are shown in the user's currency, computed by the server>

## Constraints

- Platforms and minimum OS: <iOS ≥ 15.1, Android ≥ API 24 unless changed>
- Languages: <en, ar …> · RTL needed: <yes/no>
- Compliance / privacy: <e.g. health data, GDPR, PCI — none stored on device>
- Offline needs: <what must work without network>

## Terminology

<!-- Use THESE words in code, UI copy keys and API naming. -->

| Term   | Meaning | Not to confuse with |
| ------ | ------- | ------------------- |
| <term> | <…>     | <…>                 |
