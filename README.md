# XHS Auto-Publish System MVP

This system automatically fetches content from Youge (Sanyu) and publishes it to Xiaohongshu (XHS) using Playwright and GitHub Actions.

## Setup Instructions

### 1. Youge Field Mapping
Since Youge OpenAPI doesn't provide field metadata directly, use the extraction tool to map your table fields:
1. Push this code to your GitHub Repository.
2. In GitHub Actions, run the **"Export Youge Field Map"** workflow.
3. Once completed, download the `youge-field-map` artifact.
4. Add the content of the `youge_field_map.json` to your repository under `/config/youge_field_map.json` and commit it.

### 2. GitHub Secrets
Add the following secrets to your GitHub Repository (**Settings > Secrets and variables > Actions**):
- `YOUGE_API_TOKEN`: Your Youge API token.
- `YOUGE_APP_CODE`: `apdwxrbpnqhofwigxb`
- `YOUGE_SCHEMA_CODE`: `smcpgzwm79aifk8p1y`
- `YOUGE_VIEW_ID`: `vwapmqbrwdlfcruk7p`
- `XHS_STORAGE_STATE`: The JSON content of your XHS login session (see below).

### 3. Generate XHS Storage State
To skip CAPTHCAs and manual login in GitHub Actions, you need to provide a persistent login state:
1. Run the project locally: `npm install`.
2. Run a temporary script to log in and save state:
   ```bash
   npx playwright open --save-storage=config/xhs_storage_state.json https://creator.xiaohongshu.com/publish/publish
   ```
3. Log in manually in the browser window that opens.
4. Close the browser.
5. Copy the content of `config/xhs_storage_state.json` and paste it into the GitHub Secret `XHS_STORAGE_STATE`.

## How it Works
1. **GitHub Actions** triggers the `Publish to Xiaohongshu` workflow on a schedule.
2. The script calls Youge API to find one record with `Status = pending` and `ScheduledTime <= currently`.
3. It downloads the images from the `ImageURLs` field.
4. Playwright opens the XHS Creator Center with your session, uploads images, fills the title/content, and publishes.
5. On success, it updates Youge status to `posted`. On failure, it sets it to `failed` with an error message.
