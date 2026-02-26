# 🧠🔍 build-kg-viewer

[![GitHub Stars](https://img.shields.io/github/stars/agtm1199/build-kg-viewer?style=social)](https://github.com/agtm1199/build-kg-viewer/stargazers)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](https://github.com/agtm1199/build-kg-viewer/releases/tag/v0.1.0)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js](https://img.shields.io/badge/node-%5E14.16.0-blue.svg)](https://nodejs.org/)
[![CI](https://github.com/agtm1199/build-kg-viewer/actions/workflows/node.js.yml/badge.svg)](https://github.com/agtm1199/build-kg-viewer/actions/workflows/node.js.yml)

<!-- [![Discord](https://img.shields.io/discord/YOUR_DISCORD_ID?label=Discord&logo=discord)](https://discord.gg/YOUR_INVITE) -->

[Docs](#) | [GitHub](https://github.com/agtm1199/build-kg-viewer) | [build-kg](https://github.com/agtm1199/build-kg)

> **Graph visualization for Apache AGE — with AI-powered query generation.**

---

## 🆕 What's New

**v0.1.0** — Initial open-source release
- Derived from [Apache AGE Viewer](https://github.com/apache/age-viewer) with significant enhancements
- AI-powered chat with Claude integration for natural-language Cypher query generation
- 24+ new visualization and interaction components
- Dark mode, query templates, history, undo/redo, snapshot management
- PostgreSQL 11–17 support

---

## ⚡ Quick Start

Three steps. That's it.

```bash
# 1. Clone
git clone https://github.com/agtm1199/build-kg-viewer.git && cd build-kg-viewer

# 2. Install dependencies
npm run setup

# 3. Start
npm start
```

Open [http://localhost:3000](http://localhost:3000) and connect to your PostgreSQL + AGE database.

---

## 📸 Screenshots

<!-- Screenshots coming soon -->

---

## ✨ Features

<details>
<summary><b>🤖 AI Chat — Natural Language to Cypher</b></summary>

Ask questions in plain English. The built-in Claude integration translates your intent into Cypher queries, executes them, and displays the results — all in a conversational chat panel.

- **Schema-aware**: the AI reads your graph's node types, edge types, and properties before generating queries
- **Streaming responses** via Server-Sent Events for real-time feedback
- **Session-based context** for follow-up questions — ask "show me all nodes" then "now filter to just the ones connected to X"
- Requires an [Anthropic API key](https://console.anthropic.com)

Without the API key, all other visualization features work normally.

</details>

<details>
<summary><b>📊 24+ Visualization Components</b></summary>

Beyond the original AGE Viewer, build-kg-viewer adds:

| Component | Description |
|-----------|-------------|
| **PathFinderPanel** | Find and visualize shortest paths between nodes |
| **AlgorithmsPanel** | Centrality, clustering, PageRank analysis |
| **NodeGrouping** | Collapse nodes by label or property into groups |
| **FacetedFilterSidebar** | Filter the visible graph by label, property, or range |
| **GraphSearchBar** | Full-text search across node names and properties |
| **BatchOperationsBar** | Bulk node/edge operations from the toolbar |
| **NodeDetailPanel** | Inspect all properties and relationships of a selected node |
| **NodeStylingPanel** | Custom colors, sizes, and shapes per node type |
| **StatisticsPanel** | Node/edge counts, degree distribution, graph metrics |
| **SchemaViewer** | Visual overview of your graph's ontology |
| **SnapshotManager** | Save and restore graph visualization states |
| **QueryHistoryPanel** | Searchable log of all executed queries |
| **QueryTemplatesPanel** | Pre-built Cypher query patterns for common operations |
| **QueryLoadingOverlay** | Visual feedback during long-running queries |
| **GraphTooltip** | Hover to see node/edge details without clicking |
| **GraphUndoRedo** | Step backward and forward through graph state |
| **KeyboardShortcuts** | Power-user keybindings for all common actions |
| **BreadcrumbNav** | Track your exploration path through the graph |
| **RangeFilterPanel** | Numeric range sliders for property-based filtering |
| **CytoscapeNavigator** | Minimap for large graph navigation |
| **DarkMode** | Full dark theme across all panels, modals, and editors |
| **GraphAnimations** | Smooth transitions for layout changes |
| **GraphDesignTokens** | Consistent design system for graph styling |

</details>

<details>
<summary><b>🌙 Dark Mode</b></summary>

A full dark theme designed for extended graph exploration sessions. Consistent styling across all panels, modals, and the code editor. Toggle it from the toolbar.

</details>

<details>
<summary><b>💾 Query Templates, History & Undo/Redo</b></summary>

- **Query Templates** — pre-built Cypher patterns for common graph operations (find all nodes, shortest path, neighbor lookup, etc.)
- **Query History** — searchable log of every query you've run, with one-click re-execution
- **Undo/Redo** — step backward and forward through graph visualization state

</details>

<details>
<summary><b>🐘 PostgreSQL 11–17 Support</b></summary>

Tested against PostgreSQL versions 11 through 17 with version-specific metadata queries for each. Includes support for the latest Apache AGE releases.

</details>

<details>
<summary><b>📐 Multiple Graph Layout Algorithms</b></summary>

10+ layout algorithms powered by Cytoscape.js plugins:

| Layout | Best For |
|--------|----------|
| **Dagre** | Hierarchical / tree-like graphs |
| **Cola** | Constraint-based, evenly spaced layouts |
| **Klay** | Layered directed graphs |
| **fCoSE** | Force-directed with compound node support |
| **Euler** | Large graphs with physics simulation |
| **Spread** | Maximizing use of available space |
| **CoSE Bilkent** | General-purpose force-directed |
| **D3-Force** | D3-style force simulation |
| **AVSDF** | Circular layouts |
| **CiSE** | Clustered graphs |

Switch layouts on the fly to find the best view of your data.

</details>

---

## 🔗 Works with build-kg

**build-kg-viewer** is the visual companion to [build-kg](https://github.com/agtm1199/build-kg) — the open-source knowledge graph builder for AI agents.

build-kg creates the graph. build-kg-viewer lets you see it, query it, and explore it interactively.

```bash
# 1. Build a knowledge graph with build-kg
/build-kg kubernetes networking

# 2. Point build-kg-viewer at the same database
#    Host:     localhost
#    Port:     5432
#    Database: buildkg
#    User:     buildkg
#    Password: (your DB_PASSWORD from build-kg's .env)

# 3. Explore your graph visually + ask questions with AI chat
npm start
```

Both projects use the same PostgreSQL database with [Apache AGE](https://age.apache.org/). No data export/import needed — just point the viewer at your build-kg database and start exploring.

---

## ⚙️ Configuration

build-kg-viewer connects to any PostgreSQL database with the [Apache AGE](https://age.apache.org/) extension installed. Configuration is handled through environment variables or the in-app connection dialog.

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | -- | Database name |
| `DB_USER` | -- | Database user |
| `DB_PASSWORD` | -- | Database password |
| `ANTHROPIC_API_KEY` | -- | Anthropic API key (enables AI chat feature) |

The AI chat feature requires `ANTHROPIC_API_KEY` to be set on the backend. Without it, all other visualization features work normally.

---

## 🐳 Docker

```bash
# Build the image
docker build -t build-kg-viewer .

# Run the container
docker run -p 3000:3000 build-kg-viewer
```

Open [http://localhost:3000](http://localhost:3000) and connect to your database. If your PostgreSQL instance is running on the host machine, use `host.docker.internal` (macOS/Windows) or `172.17.0.1` (Linux) as the database host.

---

## 📜 Attribution

This project is derived from [Apache AGE Viewer](https://github.com/apache/age-viewer), originally developed by the Apache Software Foundation. See the [NOTICE](NOTICE) file for full attribution.

Key additions over the original:
- AI-powered chat with Claude integration
- 24+ new visualization and interaction components
- Dark mode
- PostgreSQL 16 and 17 support
- Query history, templates, undo/redo, and snapshot management

---

## 📄 License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions of all kinds! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

**Ways to contribute:**
- **Add visualization components** — graph analysis tools, layout algorithms, export formats
- **Improve AI chat** — multi-model support, better Cypher generation, query explanation
- **Fix bugs** and improve PostgreSQL compatibility
- **Write documentation** and tutorials
- **Report bugs** and suggest features via [GitHub Issues](https://github.com/agtm1199/build-kg-viewer/issues)

---

## ⭐ Star History

If you find build-kg-viewer useful, give it a star! It helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=agtm1199/build-kg-viewer&type=Date)](https://star-history.com/#agtm1199/build-kg-viewer&Date)

---

<p align="center">
  <b>build-kg-viewer</b> — see your knowledge graph.<br/>
  Companion to <a href="https://github.com/agtm1199/build-kg">build-kg</a>.
</p>
