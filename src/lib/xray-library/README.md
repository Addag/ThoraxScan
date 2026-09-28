# Built-in CheXpert library

24 unmodified JPEG images copied from the supplied CheXpert-v1.0-small `valid` directory. `cases.json` retains the original CSV paths, all 14 label values, projection, and SHA-256 hashes. Patient age and sex are not shown or copied into the manifest.

Rebuild from the original dataset with PowerShell:

```powershell
./scripts/import-chexpert-library.ps1 -DatasetRoot 'C:/Users/MSI/Downloads/cheXpert-v1.0-small'
```

Selection iterates the CSV labels in order, chooses up to two previously unused patients with a positive label, and sorts candidates by positive-label count then source path. All images are frontal. Lung Lesion and Pleural Other have only one positive frontal example each; Fracture has none. This is deterministic metadata curation, not clinical review or a balanced evaluation set. Do not use this educational subset to report model performance.

Learning Mode loads the selected JPEG into a browser File and uses the existing analysis flow. Professor activities use the same File with the existing signed upload, verification, authorization, and publication flow. No database migration is required. Reference labels are not automatically written into the professor's private evaluation. Cases are shared learning material, so they are not suitable as unseen assessment images.

Source and attribution: [CheXpert, Stanford ML Group](https://stanfordmlgroup.github.io/competitions/chexpert/), Irvin, Rajpurkar et al., *CheXpert: A Large Chest Radiograph Dataset with Uncertainty Labels and Expert Comparison* (2019).

The images are bundled static assets and become publicly accessible when the app is deployed. The dataset agreement accepted by the dataset holder was not supplied; public redistribution permission cannot be confirmed from these local files. Verify that agreement before public deployment. The application's code license does not grant rights to these images.
