/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import type { Page } from '../page';
import { registryDirectory } from '../registry';
import type { CRPage } from './crPage';

export async function installAppIcon(page: Page) {
  const icon = await fs.promises.readFile(require.resolve('./appIcon.png'));
  const crPage = page._delegate as CRPage;
  await crPage._mainFrameSession._client.send('Browser.setDockTile', {
    image: icon.toString('base64')
  });
}

export async function syncLocalStorageWithSettings(page: Page, appName: string) {
  const settingsFile = path.join(registryDirectory, '.settings', `${appName}.json`);
  await page.exposeBinding('saveSettings', false, (_, settings: any) => {
    fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
    fs.writeFileSync(settingsFile, settings);
  });

  const settings = await fs.promises.readFile(settingsFile, 'utf-8').catch(() => ('{}'));
  await page.addInitScript(`(${String((settings: any) => {
    Object.entries(settings).map(([k, v]) => localStorage[k] = v);

    let lastValue = JSON.stringify(localStorage);
    setInterval(() => {
      const value = JSON.stringify(localStorage);
      if (value !== lastValue) {
        lastValue = value;
        window.saveSettings(value);
      }
    }, 2000);
  })})(${settings})`);
}
