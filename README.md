# CityWatch

CityWatch is a surveillance-horror strategy game where the player acts as a hidden observer monitoring a living city as a lethal entity begins to destabilize it.

## Gameplay

You are **Observer**. You cannot directly control people or units. Instead, you must:

- **Detect anomalies** through the live incident feed and city map
- **Assess incomplete information** — not all signals are reliable
- **Intervene indirectly** through communications, emergency warnings, and infrastructure influence

### Win / Lose

- **Victory** — Expose and neutralize the threat before the city collapses
- **Failure** — Citywide panic exceeds 95%, public trust collapses, or 4+ districts fall to chaos

### Controls

| Action | How |
|---|---|
| Select district | Click district on the map |
| Select incident | Click incident in the feed |
| Send communication | Click any action button in the bottom bar |
| Adjust time speed | ⏸ / ▶ / ▶▶ / ▶▶▶ buttons |
| Resolve incident | Click "Mark Resolved" in the context panel |

## City Districts

The city has 6 districts: **Downtown**, **Midtown**, **Riverside**, **Old Port**, **Eastside**, and **Suburbs**. Each district has its own trust, panic, police presence, camera coverage, and infrastructure stability values. Panicking districts can spill over into adjacent ones.

## Observer Tools

- **District Alert** — Official emergency alert to a district
- **Targeted Text** — Personal safety message to residents
- **Responder Tip** — Direct police/medical to a suspected location
- **Transit Notice** — Advisory for public transit systems
- **Building Alarm** — Remote evacuation trigger
- **Public Bulletin** — City-wide broadcast

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Building for Production

```bash
npm run build
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build / dev server)
- **Zustand** (state management)
- SVG city map with overlay modes
