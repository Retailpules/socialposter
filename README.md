# XHS Auto-Publish System MVP

This system automatically fetches content from Youge (Sanyu) and publishes it to Xiaohongshu (XHS) using Playwright and GitHub Actions.

## Setup Instructions

### 1. Youge Field Mapping (Pre-completed)
> [!NOTE]
> I have already pre-populated the field mapping for you in `config/youge_field_map.json` by inspecting your Youge API. You do **not** need to run the mapping tool manually unless you change your table structure.

### 2. GitHub Secrets
Add the following secrets to your GitHub Repository (**Settings > Secrets and variables > Actions > New repository secret**):

| Secret Name | Value |
| :--- | :--- |
| `YOUGE_API_TOKEN` | Your Youge Bearer Token |
| `YOUGE_APP_CODE` | `apdwxrbpnqhofwigxb` |
| `YOUGE_ENGINE_CODE` | `c00000000000s4-0` |
| `YOUGE_SCHEMA_CODE` | `smcpgzwm79aifk8p1y` |
| `YOUGE_VIEW_ID` | `vwapmqbrwdlfcruk7p` |
| `XHS_STORAGE_STATE` | JSON content of your XHS session (see below) |

### 3. Generate XHS Storage State (Login Session)
To bypass login and CAPTHCAs in GitHub Actions, you must provide a saved login session:

1. **Install Dependencies**: Run `npm install` in your local project folder.
2. **Launch Login Browser**:
   ```bash
   npx playwright open --save-storage=config/xhs_storage_state.json https://creator.xiaohongshu.com/publish/publish
   ```
3. **Manual Login**: In the browser that opens, log in to your Xiaohongshu Creator account.
4. **Save & Export**: Once logged in and you see the "Publish" page, close the browser.
5. **Add to GitHub**: Open `config/xhs_storage_state.json`, copy its entire content, and paste it into the GitHub Secret `XHS_STORAGE_STATE`.

## How it Works
1. **GitHub Actions**: Triggers the `Publish to Xiaohongshu` workflow daily at 02:20 and 10:20 UTC (you can adjust this in `.github/workflows/publish.yml`).
2. **Fetch Content**: The script queries Youge for one record with `Status = pending` and `ScheduledTime <= currently`.
3. **Download**: Automatically downloads and manages images from the `ImageURLs` field.
4. **Publish**: Playwright simulates a human user uploading images, typing the title/content, and clicking "Publish".
5. **Status Update**: On success, it updates Youge status to `posted`. On failure, it sets it to `failed` with an error message.
