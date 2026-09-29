# Built-in CheXpert library

All 234 unmodified JPEG images from the supplied CheXpert-v1.0-small `valid` directory: 202 frontal and 32 lateral. `cases.json` retains the original CSV paths, all 14 label values, view, projection, and SHA-256 hashes. Patient age and sex are not shown or copied into the manifest.

Rebuild from the original dataset with PowerShell:

```powershell
./scripts/import-chexpert-library.ps1 -DatasetRoot 'C:/Users/MSI/Downloads/cheXpert-v1.0-small'
```

The importer recursively includes every `.jpg` and `.jpeg` file in `valid` and requires matching CSV metadata. Gallery cases follow the row order in `valid.csv`, with case numbers assigned sequentially from that order. Multiple views from the same patient are included. The gallery supports view and positive-label filters. This is a dataset import, not clinical review. Frontal images remain recommended for the existing AI practice workflow; including lateral images does not establish model support for that view.

Learning Mode loads the selected JPEG into a browser File and uses the existing analysis flow. Professor activities use the same File with the existing signed upload, verification, authorization, and publication flow. No database migration is required. Reference labels are not automatically written into the professor's private evaluation. Cases are shared learning material, so they are not suitable as unseen assessment images.

Source and attribution: [CheXpert, Stanford ML Group](https://stanfordmlgroup.github.io/competitions/chexpert/), Irvin, Rajpurkar et al., *CheXpert: A Large Chest Radiograph Dataset with Uncertainty Labels and Expert Comparison* (2019).

The images are bundled static assets and become publicly accessible when the app is deployed. The dataset agreement accepted by the dataset holder was not supplied; public redistribution permission cannot be confirmed from these local files. Verify that agreement before public deployment. The application's code license does not grant rights to these images.
