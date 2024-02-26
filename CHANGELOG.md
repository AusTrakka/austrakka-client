
# Changelog

All notable user-facing changes to AusTrakka will be documented in this file.

## Unreleased

### Added

- Release of project analysis metadata (show-all mode):
  - A new project role, ProjectAnalyst, has been added. This role manages analysis-generated result data for the project.
  - The AusTrakka backend now supports new CLI commands for configuring project settings and field sources, and for uploading and managing datasets.
  - A Datasets tab has been added, visible to ProjectAnalysts and Viewers. This shows the analysis metadata datasets currently active within the project. Viewers may list datasets, but not alter them.
  - Each project field will now be configured to be sourced from either organisation-owned sample metadata (usually epi sample/case metadata, or sequence metadata), or project-owned dataset metadata.
  - The project Samples table, all trees, and all plots, will display metadata fields derived from both organisation-owned metadata and project-owned analysis metadata as a unified view.
  - Projects may now be configured to preferentially load high-priority fields by defining "project provisions" of a specified subset of fields, to improve client performance. Any client functionality which requires only certain fields will be available as soon as the relevant fields are loaded; for instance search on Seq_ID is available as soon as Seq_ID is loaded, and rendering of an epi curve should occur as soon as the relevant date field is loaded.
  - In the case of multiple active project datasets containing calculating values for the same field, AusTrakka will display a version of the field for each dataset, with the analysis label added to the field name to disambiguate results. This project mode is "show-all", intended primarily for research use. An "override" mode for public health will be implemented in a future release.

### Changed

- As a part of the project analysis metadata release, project data is now retrieved as a whole and queried client-side, and cached as the user navigates between pages. Consequences are:
  - Users may see longer load times on the initial load of large projects, although this should be mitigated by iterative loading of fields. 
  - Users should see faster page loads on all successive page views for a project, including any tree or plot pages.
  - It is now possible to sort columns in natural sort order (ST1, ST5, ST11 rather than ST1, ST11, ST5).
  - Quick search is now available on sample metadata tables.
  - Tree colouring of nodes or metadata blocks now uses a neutral (grey) value for null metadata values rather than a value from the selected colour palette. 


## 2024-02-14

### Changed

- Performance improvements when navigating between project tabs in large projects; this will make only a small difference to current behaviour but is to support future changes

### Fixed

- Buxfix display of booleans (Has_sequences) on the sample detail page; do not display timestamps on dates which should not have timestamps on the sample detail page (e.g. date of collection)



