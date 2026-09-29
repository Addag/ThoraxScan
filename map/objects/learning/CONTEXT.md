---
node_type: contract
status: live
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Learning objects

## Inputs

- ../../../src/app/(protected)/
- ../../../src/components/learning/
- ../../../src/components/activities/
- ../../../src/components/professor/
- ../../../src/lib/activities/, ../../../src/lib/activity-ai/, ../../../src/lib/submissions/, and ../../../src/lib/evaluations/
- ../../../supabase/migrations/20260820101401_activities_case_publication.sql and subsequent learning migrations
- ../TECHNICAL_DESIGN_DOCUMENT.md through the map root

## Job

Separate implemented workspace, activity, submission, AI analysis, feedback, evaluation, and image-library objects from the remaining planned LMS concepts.

## Outputs

The live learning cards in [../_index.md](../_index.md), including the role workspace, activity, submission, AI analysis, feedback release, faculty evaluation, X-ray case, and built-in library; remaining ghost entries stay marked there.

## Human check

Promote a learning object only when the repository contains the corresponding source and access controls; planning text alone remains ghost.
