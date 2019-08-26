/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ILicense } from '../common/types';
import { License } from '../common/license';
import { Plugin } from './plugin';
import { setup } from './test_setup';

describe('licensing plugin', () => {
  let plugin: Plugin;
  let license: ILicense;

  afterEach(async () => {
    await plugin.stop();
    sessionStorage.clear();
  });

  test('returns instance of licensing setup', async () => {
    ({ plugin, license } = await setup());
    expect(license).toBeInstanceOf(License);
  });
});
