BraiNet is a web-based service for exploring brain connectivity. It interfaces with connectivity data from multiple neuroscience resources, provides hierarchical network visualizations of brain connectivity datasets, and supports user annotations and customizations of the datasets. To use BraiNet or to obtain more information, please visit http://brainconnect.cs.brown.edu

**Note: This repo is going under significant refactoring. The master branch contains a stable copy of the pre-refactoring version of BraiNet, but it will be deprecated once the refactoring is completed. The modularization contains the refactoring-in-progress. As the name suggests, the refactoring aims to make the code more modularized so that contributors can help improve any one aspect of BraiNet - visualization, UI, data, or data processing - without having to know in details how the other aspects work. The documentation below is for the modularization branch.**

This repository consists of two top-level folders: browser and connectors.

### Browser
This folder contains code that enables the web-based service provided by BraiNet. It contains code for both the backend and the frontend. The backend is powered by Django. For more details, please visit the Wiki page.

### Connectors
This folder contains python scripts for downloading, parsing, and storing brain connectivity data files into a database. It also contains example brain connectivity data files currently available in BraiNet in JSON format and raw data files from several brain connectivity data sources.

Folders in connectors are organized into four levels:
*[Interface type]* -> *[Data type]* -> *[Data source]* -> *[File type]*

*[Interface type]* is either “database” or “resource”. The “database” folder contains everything for interfacing with the database behind the web-based service, and the “resource” folder contains everything for interfacing with external brain connectivity data sources. The “database” folder only has sub-folders on the *[Data type]* level while the “resource” folder contains sub-folders on *[Data type]*, *[Data source]*, and *[File type]* level.

*[Data type]* is either “connectivity” or “structure”. 

On the *[Data source]* level, files are split based on the data sources they come from. Currently there are two different data sources: “allen” (Allen Brain Atlas) and “bams” (Brain Architecture Management System). More can be added in the future.

On the *[File Type]* level, files are split into three different folders: “script”, “source”, and “output”. The “source” folder contains data directly downloaded from an external data source. The “output” folder contains data that are either intermediate or are ready to be uploaded into the BraiNet database (see “JSON to MySQL converter” in the Wiki page).
