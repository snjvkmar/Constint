# Constint — Project & Asset Dependency Graph

A web application for mapping interdependencies between projects and shared
assets in subsea cable operations (vessels, factories, storage barges,
warehouses) — built on **Neo4j** with an open-source graph visualizer
(**Cytoscape.js**) in the browser.

Model your business as a graph:

- **Projects** — e.g. "NorthLink HVDC Interconnector"
- **Assets** — vessels, ROVs, manufacturing plants, storage barges, warehouses
- **Cables** — the physical subsea cables belonging to a project
- **Campaigns** — survey, installation, burial, testing & commissioning phases
- **Tests** — FAT, HV withstand, mechanical load, environmental, continuity tests

...connected by typed relationships (`USES_ASSET`, `INCLUDES_CABLE`,
`INCLUDES_CAMPAIGN`, `INCLUDES_TEST`, `TESTED_BY`, `INSTALLED_IN`,
`DEPENDS_ON`, `PART_OF`) so you can see, at a glance, which projects share the
same vessel, factory, or warehouse — and what breaks if one of them slips.

## Architecture

```
┌─────────────────────┐      REST/JSON       ┌──────────────────────┐      Bolt       ┌───────────┐
│  React + Cytoscape  │ ───────────────────▶ │  Express API (Node)  │ ──────────────▶ │  Neo4j 5  │
│  (frontend/)         │ ◀─────────────────── │  (backend/)           │ ◀────────────── │  (graph DB)│
└─────────────────────┘                      └──────────────────────┘                 └───────────┘
```

- **Neo4j** stores the graph natively (nodes = entities, relationships = dependencies).
- **Backend** (`backend/`) is a thin Express REST API over the official
  `neo4j-driver`. It whitelists node labels and relationship types (see
  `backend/src/schema.js`) and validates which node types a given relationship
  is allowed to connect, so the graph can't get corrupted through the API.
  The same schema is served to the frontend (`GET /api/meta/schema`) and
  drives fully dynamic create/edit forms — no per-entity-type frontend code.
- **Frontend** (`frontend/`) is a React app that renders the graph with
  [Cytoscape.js](https://js.cytoscape.org/) (open source, MIT licensed),
  colored/shaped by node type, with click-to-inspect, click-to-edit, and a
  "link mode" to create a dependency by clicking two nodes on the canvas.

## Quick start (Docker Compose)

Requires Docker and network access to Docker Hub / Neo4j's registry (not
guaranteed inside restricted sandboxes — see note below).

```bash
docker compose up -d neo4j          # start the graph database
cd backend && npm install && npm run seed   # load the synthetic dataset
cd ..
docker compose up -d --build backend frontend
```

- Neo4j Browser: http://localhost:7474 (user `neo4j`, password `constint-password`)
- API: http://localhost:4000/api
- App: http://localhost:5173

## Local development (without Docker for the app)

```bash
# 1. Start just the database
docker compose up -d neo4j

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run seed     # (re)populate the graph with synthetic subsea-cable data
npm run dev       # http://localhost:4000

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev       # http://localhost:5173
```

> **Note on this repo's own dev sandbox:** the environment this project was
> authored in has an egress policy that blocks Docker Hub and Neo4j's
> distribution/download hosts, so a live Neo4j instance could not be started
> to exercise the API end-to-end here. The backend was syntax-checked, boots
> cleanly, and its DB-independent routes were verified; the frontend was
> build-verified. Run the Quick Start above in a normal environment to bring
> up a live Neo4j and seed it.

## Data model

| Label      | Key attributes                                                                 |
|------------|---------------------------------------------------------------------------------|
| `Project`  | name, client, region, status, startDate, endDate, budgetUsd, projectManager    |
| `Asset`    | name, assetType, owner, location, capacity, status, dayRateUsd                |
| `Cable`    | name, cableType, voltageKv, lengthKm, manufacturer, status                    |
| `Campaign` | name, campaignType, startDate, endDate, status, location                      |
| `Test`     | name, testType, standard, result, testDate, engineer                          |

| Relationship         | Connects                          | Example attributes            |
|----------------------|------------------------------------|--------------------------------|
| `USES_ASSET`         | Project/Campaign → Asset           | role, allocationPercent, dates |
| `INCLUDES_CABLE`     | Project → Cable                     | —                               |
| `INCLUDES_CAMPAIGN`  | Project → Campaign                  | —                               |
| `INCLUDES_TEST`      | Campaign → Test                     | —                               |
| `TESTED_BY`          | Cable → Test                        | —                               |
| `INSTALLED_IN`       | Cable → Campaign                    | —                               |
| `DEPENDS_ON`         | any → any (generic)                 | reason, criticality            |
| `PART_OF`            | Asset → Asset                       | reason                          |

The full schema (including form field types/options) lives in
`backend/src/schema.js` and is the single source of truth for both API
validation and the frontend's dynamic forms.

## Synthetic dataset

`backend/src/seed/data.js` models 5 subsea-cable projects (Baltic, North Sea,
Irish Sea, North Atlantic, Coral Sea) that intentionally **share** the same
survey vessel, cable-lay vessel, burial vessel, storage barge, two
manufacturing plants, and one warehouse — so the graph immediately shows
real cross-project dependencies (e.g. delaying the shared cable-lay vessel
affects two projects at once). Run `npm run seed` in `backend/` to (re)load
it; the script clears the graph first, so it's safe to re-run.

## API reference

All endpoints are under `/api`.

| Method & path              | Description                                             |
|-----------------------------|-----------------------------------------------------------|
| `GET /graph`                | Full node + edge set (for the visualizer)                |
| `GET /meta/schema`          | Node/edge schemas (labels, fields, allowed connections)   |
| `GET /nodes?label=&search=` | List nodes, optionally filtered                          |
| `GET /nodes/:id`            | Get one node                                              |
| `POST /nodes`               | Create `{ label, properties }`                            |
| `PUT /nodes/:id`            | Update `{ properties }` (merged)                          |
| `DELETE /nodes/:id`         | Delete a node and all its relationships                   |
| `GET /edges`                | List relationships                                        |
| `POST /edges`               | Create `{ sourceId, targetId, type, properties }`         |
| `PUT /edges/:id`            | Update `{ properties }` (merged)                          |
| `DELETE /edges/:id`         | Delete a relationship                                     |

## Using the app

- **Pan/zoom** the canvas; click a node or dependency to see its attributes
  in the right panel.
- **+ Add Node** / **+ Add Dependency** in the sidebar open forms generated
  from the schema.
- **Link Mode**: click it, then click two nodes on the canvas to create a
  dependency between them without typing IDs.
- **Node Types** checkboxes filter what's shown; **Search** filters by name.
- **Edit**/**Delete** in the details panel modify the graph directly in Neo4j.

## Why Neo4j + Cytoscape.js

Neo4j is a native graph database — dependency traversal (e.g. "what uses
the vessel that's late") is a first-class query, not a JOIN-heavy afterthought.
Cytoscape.js is a mature, open-source (MIT) graph visualization library used
widely for exactly this kind of interactive network diagram, and — unlike
tools that connect directly to the database from the browser — this app
keeps Neo4j credentials server-side and goes through a validated REST API.
