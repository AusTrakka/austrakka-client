# Changelog

All notable user-facing changes to AusTrakka will be documented in this file.

## Unrealeased

### Added
- Colour scheme is now selectable per field on the tree view.

## 2024-05-28

### Fixed
- Fixed broken sample view

## 2024-05-21

### Added

- Admin view of all AusTrakka field details.

### Fixed

- Organisation sample table view now correctly shows all rows.
- User's name in the sidebar now draws on the AusTrakka-set display name, which we can update, rather than drawing directly on the Azure display name.

## 2024-05-11

### Fixed

- SVG export of trees now correctly renders the tree nodes in the SVG file.


## 2024-05-06

### Added

- Admin user management interface added. Admins can now view and edit user details, including display name, contact email, organisation, group-role assignments, and activation status. Easier access for admins to a user's objectID.

## 2024-05-03

### Changed
- All legends (trees and plots) now list only values present in the data itself, even if the field is a categorical field with additional valid values.
- Plot and tree legends will now be sorted in natural sort order (ST1, ST5, ST11 rather than ST1, ST11, ST5).
- Plot colouring now uses a neutral (grey) value for null metadata values.

### Fixed
- Has_sequences field will no longer display "false" values while the field is still loading; instead it will appear, correctly, as empty
- Reinstate using a neutral (grey) value for null metadata values on trees.

## 2024-04-23

### Fixed
- Performance issues when loading users page

### Changed
- Plots may now optionally be specified as Vega, instead of Vega-Lite.

## 2024-04-12

### Added
- User management page for admins.

### Fixed
- Bug with quick search in tree view.

## 2024-04-11

### Fixed
- Dashboard table rows are now clickable.

## 2024-04-04

### Fixed

- Fixes an issue where the Projects table did not occupy the full height of the browser window, and adds a minimum height regardless of window size.

## 2024-03-27

### Added

- The functionality of tabular displays has been updated:
  - Tables containing many rows, for instance sample table views for large projects, will now have significantly improved performance.
  - CSV export of sample data should now correctly escape values containing quotes.
  - A control is now available to toggle vertical rendering of table columns in the sample table. This allows column widths to be made very narrow, if desired, without hiding column headers.
  - Default column widths now better adapt to the data.
  - Column sort controls are now a toggle, rather than a dropdown, and are quicker to use.
  - The pagination controls have been moved to the bottom-left of the table to make it more obvious when the current table view does not show all available items.

### Fixed

- The data filter component on tables, plots and trees now correctly makes available numerical operators (e.g. greater than, less than) for floating-point numerical fields. Previously numerical operators were only appearing for integer numerical fields.

## 2024-03-21

### Added

- Override mode for project analysis metadata is now available. In the case of multiple active project datasets containing calculated values for the same field, AusTrakka will display only the most recent values of the metadata for that field. All values for a field (including nulls) will be sourced from the latest project dataset containing that field.

### Changed

- The project merge algorithm ("override" or "show all") is now shown on the Datasets tab.
- When a project is in "show all" mode, and no datasets have yet been uploaded for a particular metadata field, no columns will be displayed for that field. Previously, an empty column would display.

## 2024-03-15

### Added

- Release of project analysis metadata (show-all mode):
  - A new project role, ProjectAnalyst, has been added. This role manages analysis-generated result data for the project.
  - The AusTrakka backend now supports new CLI commands for configuring project settings and field sources, and for uploading and managing datasets.
  - A Datasets tab has been added, visible to ProjectAnalysts and Viewers. This shows the analysis metadata datasets currently active within the project. Viewers may list datasets, but not alter them. 
  - Each project field will now be configured to be sourced from either organisation-owned sample metadata (usually epi sample/case metadata, or sequence metadata), or project-owned dataset metadata. Seq_ID is always be sourced from both, as it is used to merge sample and dataset metadata; no other field in a project may be sourced from both.
  - The project Samples table, all trees, and all plots, will display metadata fields derived from both organisation-owned metadata and project-owned analysis metadata as a unified view.
  - Projects may now be configured to preferentially load high-priority fields by defining "project provisions" of a specified subset of fields, to improve client performance. Any client functionality which requires only certain fields will be available as soon as the relevant fields are loaded; for instance search on Seq_ID is available as soon as Seq_ID is loaded, and rendering of an epi curve should occur as soon as the relevant date field is loaded.
  - In the case of multiple active project datasets containing calculated values for the same field, AusTrakka will display a version of the field for each dataset, with the analysis label added to the field name to disambiguate results. This project mode is "show-all", intended primarily for research use. An "override" mode for public health will be implemented in a future release.

### Changed

- As a part of the project analysis metadata release, project data is now retrieved as a whole and queried client-side, and cached as the user navigates between pages. As a part of this change:
  - Users may see longer load times on the initial load of large projects. 
  - Users should see faster page loads on all successive page views for a project, including any tree or plot pages.
  - It is now possible to sort columns in natural sort order (ST1, ST5, ST11 rather than ST1, ST11, ST5).
  - Quick search is now available on sample metadata tables.
- Tree colouring of nodes or metadata blocks now uses a neutral (grey) value for null metadata values. This improvement has not yet been made for plots.
- Allowed values are now returned when listing available metadata fields. As a result, the `austrakka field list` CLI command will now display allowed values for categorical (i.e. controlled) fields.

### Fixed

- Additional checks have been added to guard against simultaneous upload of sequences to the same Seq_ID, which could previously, in rare cases, lead to more than one active version of a sequence or sequence file pair for the same Seq_ID.


## 2024-02-14

### Changed

- Performance improvements when navigating between project tabs in large projects; this will make only a small difference to current behaviour but will support future changes.

### Fixed

- Buxfix display of booleans (Has_sequences) on the sample detail page; do not display timestamps on dates which should not have timestamps on the sample detail page (e.g. date of collection).
